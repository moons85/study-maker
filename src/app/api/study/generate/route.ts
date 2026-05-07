import { NextResponse } from "next/server";

import {
  createGenerationCacheKey,
  createGenerationLockKey,
} from "@/lib/cache-key";
import { getOpenAI } from "@/lib/openai";
import {
  collectSourceCandidates,
  toSourceRows,
} from "@/lib/source-candidates";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { validateTopicLocally } from "@/lib/topic-normalizer";
import {
  generatedStudySchema,
  generateStudyRequestSchema,
} from "@/lib/validation";
import { GeneratedQuestion, GeneratedStudy, Level } from "@/types/study";
import { StudySource } from "@/types/study";

const QUESTION_COUNT = 10;
const stageRank: Record<Level, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function createPrompt(body: {
  topic: string;
  normalizedTopic: string;
  stage: Level;
  sources: StudySource[];
}) {
  const sourceContext = body.sources.map((source) => ({
    title: source.title,
    type: source.sourceType,
    reliability: source.reliability,
    summary: source.summary,
  }));

  return [
    "한국어 학습 콘텐츠를 JSON으로만 생성하세요.",
    "대상은 개발자가 아니라 일반 학습자입니다. 주제가 개발 관련이어도 쉬운 설명을 먼저 사용하세요.",
    `주제: ${body.normalizedTopic}`,
    `원문 입력: ${body.topic}`,
    `단계: ${body.stage}`,
    `참고 출처 후보: ${JSON.stringify(sourceContext)}`,
    "참고 출처 후보가 있으면 개념 설명의 정확성 확인에 사용하되, 출처 원문을 길게 복사하지 말고 학습자용 설명으로 재구성하세요.",
    "community 출처는 보조 배경으로만 사용하고 사실 기준은 official 또는 encyclopedia 출처를 우선하세요.",
    "단계 규칙: beginner=용어/정의/쉬운 예시, intermediate=적용/비교/상황 판단, advanced=응용/서술/오류 찾기",
    "문제는 정확히 10개입니다.",
    "questions 배열의 길이는 반드시 10이어야 합니다. 9개 이하 또는 11개 이상이면 실패입니다.",
    "문제 유형은 ox, multiple_choice, blank, short_answer, essay 중 최소 3개 이상을 섞으세요.",
    "모든 문제는 stage, hint, answer, explanation, relatedConcept를 포함해야 합니다.",
    "힌트는 정답을 직접 말하지 말고 사고 방향만 제시하세요.",
    "essay 문제는 모호하면 안 됩니다. 구체적인 상황, 답변 관점, 요구 분량(예: 2~3문장), 포함해야 할 핵심 요소를 question에 모두 포함하세요.",
    "essay 문제의 answer는 단순 정답이 아니라 채점 기준이 되는 핵심 요소 목록 또는 모범 답안이어야 합니다.",
    "short_answer 문제도 가능한 답변 범위를 좁혀서 하나의 명확한 핵심 개념을 묻게 하세요.",
    "content.concepts는 5~7개이며 각 항목은 title, description, example, misconception, checkpoint를 포함하세요.",
    "아래 구조와 같은 JSON만 반환하세요.",
    JSON.stringify({
      content: {
        topic: "string",
        normalizedTopic: body.normalizedTopic,
        summary: "string",
        analogy: "string",
        outline: ["string"],
        concepts: [
          {
            title: "string",
            description: "string",
            example: "string",
            misconception: "string",
            checkpoint: "string",
          },
        ],
        terms: [{ term: "string", meaning: "string" }],
        keyPoints: ["string"],
        reviewChecklist: ["string"],
      },
      questions: [
        {
          type: "ox | multiple_choice | blank | short_answer | essay",
          stage: body.stage,
          question: "string",
          options: ["string"],
          hint: "string",
          answer: "string 또는 string[]",
          explanation: "string",
          relatedConcept: "string",
          difficulty: "easy | medium | hard",
        },
      ],
    }),
  ].join("\n");
}

function createSupplementPrompt(body: {
  topic: string;
  normalizedTopic: string;
  stage: Level;
  missingCount: number;
  existingQuestions: Array<{ type: string; question: string }>;
}) {
  return [
    "한국어 학습 문제만 JSON으로 생성하세요.",
    `주제: ${body.normalizedTopic}`,
    `단계: ${body.stage}`,
    `부족한 문제 수: ${body.missingCount}`,
    "기존 문제와 중복되지 않는 새 문제만 생성하세요.",
    `기존 문제: ${JSON.stringify(body.existingQuestions)}`,
    "questions 배열 길이는 부족한 문제 수와 정확히 같아야 합니다.",
    "문제 유형은 ox, multiple_choice, blank, short_answer, essay 중에서 섞되, 모든 문제는 stage, hint, answer, explanation, relatedConcept, difficulty를 포함해야 합니다.",
    "essay 문제는 구체적인 상황, 요구 분량, 포함할 핵심 요소를 question에 포함하세요.",
    "아래 구조와 같은 JSON만 반환하세요.",
    JSON.stringify({
      questions: [
        {
          type: "ox | multiple_choice | blank | short_answer | essay",
          stage: body.stage,
          question: "string",
          options: ["string"],
          hint: "string",
          answer: "string 또는 string[]",
          explanation: "string",
          relatedConcept: "string",
          difficulty: "easy | medium | hard",
        },
      ],
    }),
  ].join("\n");
}

async function completeQuestionCount({
  generated,
  body,
}: {
  generated: unknown;
  body: {
    topic: string;
    normalizedTopic: string;
    stage: Level;
  };
}) {
  const parsed = generated as Partial<GeneratedStudy>;
  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

  if (questions.length >= QUESTION_COUNT) {
    return {
      ...parsed,
      questions: questions.slice(0, QUESTION_COUNT),
    };
  }

  const missingCount = QUESTION_COUNT - questions.length;
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return valid JSON only. Do not include markdown.",
      },
      {
        role: "user",
        content: createSupplementPrompt({
          ...body,
          missingCount,
          existingQuestions: questions.map((question) => ({
            type:
              typeof question === "object" && question && "type" in question
                ? String(question.type)
                : "",
            question:
              typeof question === "object" && question && "question" in question
                ? String(question.question)
                : "",
          })),
        }),
      },
    ],
  });
  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    throw new Error("부족한 문제를 보충 생성하지 못했습니다.");
  }

  const supplement = JSON.parse(raw) as { questions?: unknown[] };
  const supplementQuestions = Array.isArray(supplement.questions)
    ? supplement.questions
    : [];

  return {
    ...parsed,
    questions: [...questions, ...supplementQuestions].slice(0, QUESTION_COUNT),
  };
}

async function assertStageAllowed({
  anonymousId,
  normalizedTopic,
  stage,
}: {
  anonymousId: string;
  normalizedTopic: string;
  stage: Level;
}) {
  if (stage === "beginner") return;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("unlocked_stage")
    .eq("anonymous_id", anonymousId)
    .eq("normalized_topic", normalizedTopic)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const unlockedStage = (data?.unlocked_stage ?? "beginner") as Level;

  if (stageRank[unlockedStage] < stageRank[stage]) {
    throw new Error("이전 단계를 통과해야 다음 단계를 시작할 수 있습니다.");
  }
}

async function createSessionFromGenerated({
  anonymousId,
  folderId,
  topic,
  normalizedTopic,
  stage,
  generated,
  sources,
}: {
  anonymousId: string;
  folderId?: string | null;
  topic: string;
  normalizedTopic: string;
  stage: Level;
  generated: GeneratedStudy;
  sources: StudySource[];
}) {
  const supabase = getSupabaseAdmin();

  if (folderId) {
    const { data: folder, error: folderError } = await supabase
      .from("study_folders")
      .select("id")
      .eq("id", folderId)
      .eq("anonymous_id", anonymousId)
      .maybeSingle();

    if (folderError || !folder) {
      throw folderError ?? new Error("선택한 폴더를 사용할 수 없습니다.");
    }
  }

  const { data: previous } = await supabase
    .from("study_sessions")
    .select("unlocked_stage")
    .eq("anonymous_id", anonymousId)
    .eq("normalized_topic", normalizedTopic)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const unlockedStage = (previous?.unlocked_stage ?? "beginner") as Level;

  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .insert({
      anonymous_id: anonymousId,
      folder_id: folderId ?? null,
      topic,
      normalized_topic: normalizedTopic,
      level: stage,
      current_stage: stage,
      unlocked_stage: unlockedStage,
      question_count: QUESTION_COUNT,
      question_types: [],
      content: generated.content,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw sessionError ?? new Error("Failed to create study session");
  }

  const questionRows = generated.questions.map(
    (question: GeneratedQuestion, index) => ({
      session_id: session.id,
      order_no: index + 1,
      type: question.type,
      stage,
      question: question.question,
      options: question.options ?? null,
      hint: question.hint,
      answer: question.answer,
      explanation: question.explanation,
      related_concept: question.relatedConcept,
      difficulty: question.difficulty,
    }),
  );

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .insert(questionRows)
    .select(
      "id, type, stage, question, options, hint, answer, explanation, related_concept, difficulty",
    );

  if (questionsError || !questions) {
    await supabase.from("study_sessions").delete().eq("id", session.id);
    throw questionsError ?? new Error("Failed to create questions");
  }

  if (sources.length > 0) {
    const { error: sourcesError } = await supabase
      .from("study_sources")
      .upsert(toSourceRows({ sessionId: session.id, sources }), {
        onConflict: "session_id,url",
      });

    if (sourcesError) {
      throw sourcesError;
    }
  }

  return { session, questions };
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  let lockKey: string | null = null;

  try {
    const body = generateStudyRequestSchema.parse(await request.json());
    const topicValidation = validateTopicLocally(body.topic);

    if (topicValidation.status === "blocked" || topicValidation.status === "too_broad") {
      return NextResponse.json(topicValidation, { status: 400 });
    }

    await assertStageAllowed({
      anonymousId: body.anonymousId,
      normalizedTopic: body.normalizedTopic,
      stage: body.stage,
    });

    const cacheKey = createGenerationCacheKey(body.normalizedTopic, body.stage);
    lockKey = createGenerationLockKey(
      body.anonymousId,
      body.normalizedTopic,
      body.stage,
    );

    const { data: existingLock } = await supabase
      .from("generation_locks")
      .select("status, session_id, expires_at")
      .eq("lock_key", lockKey)
      .maybeSingle();

    if (
      existingLock?.status === "completed" &&
      existingLock.session_id
    ) {
      return NextResponse.json({
        sessionId: existingLock.session_id,
        reused: true,
      });
    }

    if (
      existingLock?.status === "pending" &&
      new Date(existingLock.expires_at).getTime() > Date.now()
    ) {
      return NextResponse.json(
        { message: "같은 주제의 학습 세트를 생성 중입니다. 잠시 후 다시 시도하세요." },
        { status: 409 },
      );
    }

    await supabase.from("generation_locks").upsert({
      lock_key: lockKey,
      anonymous_id: body.anonymousId,
      normalized_topic: body.normalizedTopic,
      stage: body.stage,
      status: "pending",
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    });

    const { data: cached } = await supabase
      .from("ai_generation_cache")
      .select("content, questions")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    let generated: GeneratedStudy;
    const sources = await collectSourceCandidates(body.normalizedTopic);

    if (cached) {
      generated = generatedStudySchema.parse({
        content: cached.content,
        questions: cached.questions,
      });
    } else {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Return valid JSON only. Do not include markdown.",
          },
          { role: "user", content: createPrompt({ ...body, sources }) },
        ],
      });

      const raw = completion.choices[0]?.message.content;

      if (!raw) {
        throw new Error("AI가 학습 콘텐츠를 생성하지 못했습니다.");
      }

      generated = generatedStudySchema.parse(
        await completeQuestionCount({
          generated: JSON.parse(raw),
          body,
        }),
      );

      await supabase.from("ai_generation_cache").upsert({
        cache_key: cacheKey,
        normalized_topic: body.normalizedTopic,
        stage: body.stage,
        content: generated.content,
        questions: generated.questions,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    const { session, questions } = await createSessionFromGenerated({
      anonymousId: body.anonymousId,
      folderId: body.folderId,
      topic: body.topic,
      normalizedTopic: body.normalizedTopic,
      stage: body.stage,
      generated,
      sources,
    });

    await supabase
      .from("generation_locks")
      .update({ status: "completed", session_id: session.id })
      .eq("lock_key", lockKey);

    return NextResponse.json({
      sessionId: session.id,
      stage: body.stage,
      content: generated.content,
      questions,
    });
  } catch (error) {
    console.error(error);

    if (lockKey) {
      await supabase
        .from("generation_locks")
        .update({ status: "failed" })
        .eq("lock_key", lockKey);
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "학습 콘텐츠 생성 중 오류가 발생했습니다.",
      },
      { status: 400 },
    );
  }
}
