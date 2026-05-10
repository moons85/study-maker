import { NextResponse } from "next/server";

import {
  assertAndRecordAiUsage,
  isUsageLimitError,
} from "@/lib/ai-usage-limit";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { gradeStudyRequestSchema } from "@/lib/validation";
import { getNextStage, Level } from "@/types/study";

type DbQuestion = {
  id: string;
  type: string;
  question: string;
  answer: string | string[];
  explanation: string;
  related_concept?: string | null;
};

type GradedQuestionResult = {
  questionId: string;
  question: string;
  isCorrect: boolean;
  score: number;
  userAnswer: string;
  correctAnswer: string | string[];
  explanation: string;
  relatedConcept?: string | null;
  feedback?: string;
  questionType: string;
};

function normalizeAnswer(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isSimpleCorrect(question: DbQuestion, answer: string) {
  const correctAnswer = Array.isArray(question.answer)
    ? question.answer
    : [question.answer];

  return correctAnswer.some(
    (candidate) => normalizeAnswer(candidate) === normalizeAnswer(answer),
  );
}

function classifyMistake(result: GradedQuestionResult) {
  if (!result.userAnswer.trim()) return "careless";
  if (result.questionType === "essay") return "essay_incomplete";
  if (result.questionType === "blank" || result.questionType === "short_answer") {
    return "term_confusion";
  }

  return "concept_gap";
}

function createNextReviewAt(result: GradedQuestionResult) {
  const delayDays = result.score >= 50 ? 3 : 1;
  return new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString();
}

export async function POST(request: Request) {
  try {
    const body = gradeStudyRequestSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data: session, error: sessionError } = await supabase
      .from("study_sessions")
      .select("id, anonymous_id, topic, normalized_topic, unlocked_stage")
      .eq("id", body.sessionId)
      .single();

    if (sessionError || !session) {
      throw sessionError ?? new Error("Failed to load session");
    }

    if (session.anonymous_id !== body.anonymousId) {
      throw new Error("이 학습 세션에 접근할 수 없습니다.");
    }

    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, type, question, answer, explanation, related_concept")
      .eq("session_id", body.sessionId)
      .eq("stage", body.stage)
      .order("order_no", { ascending: true });

    if (questionsError || !questions) {
      throw questionsError ?? new Error("Failed to load questions");
    }

    const answerMap = new Map(
      body.answers.map((answer) => [answer.questionId, answer.answer]),
    );
    const subjectiveQuestions = questions.filter((question) =>
      ["short_answer", "essay"].includes(question.type),
    );

    let aiScores = new Map<string, { score: number; feedback: string }>();

    if (subjectiveQuestions.length > 0) {
      await assertAndRecordAiUsage({
        request,
        anonymousId: body.anonymousId,
        action: "study_grade",
        metadata: {
          sessionId: body.sessionId,
          stage: body.stage,
          subjectiveCount: subjectiveQuestions.length,
        },
      });

      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Grade Korean short-answer and essay responses. Return valid JSON only.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "각 답안을 0~100점으로 평가하고 짧은 한국어 피드백을 주세요. 힌트 사용만으로 감점하지 마세요. correctAnswer와 explanation을 평가 기준으로 삼고, 서술형은 질문에서 요구한 조건과 핵심 요소가 답변에 포함됐는지 확인하세요.",
              items: subjectiveQuestions.map((question) => ({
                questionId: question.id,
                question: question.question,
                correctAnswer: question.answer,
                explanation: question.explanation,
                relatedConcept: question.related_concept,
                userAnswer: answerMap.get(question.id) ?? "",
              })),
              responseShape: {
                results: [
                  {
                    questionId: "uuid",
                    score: 0,
                    feedback: "string",
                  },
                ],
              },
            }),
          },
        ],
      });

      const raw = completion.choices[0]?.message.content;

      if (raw) {
        const parsed = JSON.parse(raw) as {
          results?: Array<{
            questionId: string;
            score: number;
            feedback: string;
          }>;
        };

        aiScores = new Map(
          (parsed.results ?? []).map((result) => [
            result.questionId,
            {
              score: Math.max(0, Math.min(100, Math.round(result.score))),
              feedback: result.feedback,
            },
          ]),
        );
      }
    }

    const results = (questions as DbQuestion[]).map((question) => {
      const userAnswer = answerMap.get(question.id) ?? "";

      if (["short_answer", "essay"].includes(question.type)) {
        const aiResult = aiScores.get(question.id) ?? {
          score: 0,
          feedback: "AI 평가 결과를 가져오지 못했습니다.",
        };

        return {
          questionId: question.id,
          question: question.question,
          isCorrect: aiResult.score >= 70,
          score: aiResult.score,
          userAnswer,
          correctAnswer: question.answer,
          explanation: question.explanation,
          relatedConcept: question.related_concept,
          feedback: aiResult.feedback,
          questionType: question.type,
        };
      }

      const isCorrect = isSimpleCorrect(question, userAnswer);

      return {
        questionId: question.id,
        question: question.question,
        isCorrect,
        score: isCorrect ? 100 : 0,
        userAnswer,
        correctAnswer: question.answer,
        explanation: question.explanation,
        relatedConcept: question.related_concept,
        questionType: question.type,
      };
    }) as GradedQuestionResult[];

    const totalScore =
      results.length === 0
        ? 0
        : Math.round(
            results.reduce((sum, result) => sum + result.score, 0) /
              results.length,
          );
    const correctCount = results.filter((result) => result.isCorrect).length;
    const nextStage = getNextStage(body.stage as Level);
    const unlockedNextStage = Boolean(nextStage && totalScore >= 70);
    const unlockedStage = unlockedNextStage ? nextStage : session.unlocked_stage;

    const feedback = {
      summary:
        totalScore >= 70
          ? nextStage
            ? "다음 단계가 열렸습니다. 이어서 더 어려운 문제에 도전해보세요."
            : "고급 단계까지 완료했습니다. 오답 해설을 복습해보세요."
          : "현재 단계의 핵심 개념을 다시 읽고 재도전해보세요.",
      reviewTopics: results
        .filter((result) => !result.isCorrect)
        .slice(0, 3)
        .map((result) => result.explanation),
      results,
    };

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        session_id: body.sessionId,
        anonymous_id: body.anonymousId,
        answers: body.answers,
        stage: body.stage,
        hint_usage: body.hintUsage,
        score: totalScore,
        unlocked_next_stage: unlockedNextStage,
        feedback,
      })
      .select("id")
      .single();

    if (submissionError || !submission) {
      throw submissionError ?? new Error("Failed to save submission");
    }

    const hintUsageMap = new Map(
      body.hintUsage.map((item) => [item.questionId, item.usedHint]),
    );
    const wrongRows = results
      .filter((result) => !result.isCorrect)
      .map((result) => ({
        anonymous_id: body.anonymousId,
        session_id: body.sessionId,
        question_id: result.questionId,
        topic: session.topic,
        stage: body.stage,
        question_type: result.questionType,
        question: result.question,
        user_answer: result.userAnswer,
        correct_answer: result.correctAnswer,
        explanation: result.explanation,
        related_concept: result.relatedConcept,
        mistake_type: classifyMistake(result),
        hint_used: hintUsageMap.get(result.questionId) ?? false,
        status: "open",
        next_review_at: createNextReviewAt(result),
        updated_at: new Date().toISOString(),
      }));

    if (wrongRows.length > 0) {
      const { error: wrongNotesError } = await supabase
        .from("wrong_notes")
        .upsert(wrongRows, { onConflict: "anonymous_id,question_id" });

      if (wrongNotesError) {
        throw wrongNotesError;
      }
    }

    if (unlockedNextStage) {
      await supabase
        .from("study_sessions")
        .update({ unlocked_stage: unlockedStage })
        .eq("anonymous_id", body.anonymousId)
        .eq("normalized_topic", session.normalized_topic);
    }

    return NextResponse.json({
      submissionId: submission.id,
      score: totalScore,
      stage: body.stage,
      unlockedNextStage,
      nextStage,
      correctCount,
      wrongCount: results.length - correctCount,
      results,
      feedback,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "채점 중 오류가 발생했습니다.",
      },
      { status: isUsageLimitError(error) ? error.status : 400 },
    );
  }
}
