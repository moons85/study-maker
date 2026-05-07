import Link from "next/link";

import { NextStageButton } from "@/components/study/NextStageButton";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getNextStage, Level } from "@/types/study";

type Feedback = {
  summary?: string;
  reviewTopics?: string[];
  results?: Array<{
    questionId: string;
    question?: string;
    isCorrect: boolean;
    score: number;
    userAnswer: string;
    correctAnswer: string | string[];
    explanation: string;
    relatedConcept?: string | null;
    feedback?: string;
  }>;
};

function formatAnswer(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join(", ") : answer;
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase
    .from("study_sessions")
    .select("topic, normalized_topic, current_stage, folder_id")
    .eq("id", sessionId)
    .single();
  const { data: submission } = await supabase
    .from("submissions")
    .select("score, stage, hint_usage, unlocked_next_stage, feedback")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const feedback = (submission?.feedback ?? {}) as Feedback;
  const results = feedback.results ?? [];
  const correctCount = results.filter((result) => result.isCorrect).length;
  const stage = (submission?.stage ?? session?.current_stage ?? "beginner") as Level;
  const nextStage = getNextStage(stage);
  const hintUsage = Array.isArray(submission?.hint_usage)
    ? submission.hint_usage
    : [];
  const hintCount = hintUsage.filter(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "usedHint" in item &&
      Boolean(item.usedHint),
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-[28px] border-2 border-lime-100 bg-white p-5 shadow-[0_10px_0_#d7e7c8] sm:p-8">
        <p className="mb-2 text-sm font-black text-lime-700">
          {session?.topic ?? "학습 결과"}
        </p>
        <h1 className="text-3xl font-black">학습 결과</h1>
        <div className="mt-6 text-6xl font-black text-lime-600">
          {submission?.score ?? 0}점
        </div>
        <p className="mt-4 font-bold">
          정답 {correctCount}개 / 오답 {Math.max(0, results.length - correctCount)}
          개
        </p>
        <p className="mt-2 text-sm font-bold text-slate-500">
          힌트 사용 {hintCount}개
        </p>

        {submission?.unlocked_next_stage && nextStage ? (
          <div className="mt-6 rounded-2xl bg-lime-50 p-4">
            <h2 className="font-black text-lime-900">다음 단계가 열렸습니다</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              70점 이상을 달성해서 같은 주제의 다음 난이도를 학습할 수 있습니다.
            </p>
          </div>
        ) : nextStage ? (
          <div className="mt-6 rounded-2xl bg-yellow-50 p-4">
            <h2 className="font-black text-yellow-900">조금 더 연습이 필요합니다</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              70점 이상을 받으면 다음 단계가 열립니다.
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-sky-50 p-4">
            <h2 className="font-black text-sky-900">고급 단계까지 완료했습니다</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              같은 주제를 다시 풀거나 새로운 주제로 학습을 이어갈 수 있습니다.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-sky-50 p-4">
          <h2 className="font-black text-sky-800">AI 피드백</h2>
          <p className="mt-2 leading-7 text-slate-800">
            {feedback.summary ?? "제출 결과가 아직 없습니다."}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {results.map((result, index) => (
            <article
              key={result.questionId}
              className={`rounded-2xl border-2 p-4 ${
                result.isCorrect
                  ? "border-green-100 bg-green-50"
                  : "border-red-100 bg-red-50"
              }`}
            >
              <h3
                className={`font-black ${
                  result.isCorrect ? "text-green-800" : "text-red-800"
                }`}
              >
                문제 {index + 1} {result.isCorrect ? "정답" : "오답"} ·{" "}
                {result.score}점
              </h3>
              {result.question ? (
                <p className="mt-3 text-sm font-bold leading-6 text-slate-900">
                  {result.question}
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {result.feedback ?? result.explanation}
              </p>
              {!result.isCorrect ? (
                <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm leading-6">
                  <p>
                    <span className="font-black text-slate-900">내 답변: </span>
                    <span className="text-slate-700">
                      {result.userAnswer || "답변 없음"}
                    </span>
                  </p>
                  <p>
                    <span className="font-black text-red-700">정답: </span>
                    <span className="text-slate-900">
                      {formatAnswer(result.correctAnswer)}
                    </span>
                  </p>
                  <p>
                    <span className="font-black text-slate-900">해설: </span>
                    <span className="text-slate-700">{result.explanation}</span>
                  </p>
                  {result.relatedConcept ? (
                    <p>
                      <span className="font-black text-slate-900">
                        관련 개념:{" "}
                      </span>
                      <span className="text-slate-700">
                        {result.relatedConcept}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <Link
            href={`/quiz/${sessionId}`}
            className="flex h-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-800"
          >
            다시 풀기
          </Link>
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-800"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/wrong-notes"
            className="flex h-12 items-center justify-center rounded-2xl border-2 border-orange-100 bg-orange-50 font-black text-orange-800"
          >
            오답노트
          </Link>
          {submission?.unlocked_next_stage && nextStage && session ? (
            <NextStageButton
              topic={session.topic}
              normalizedTopic={session.normalized_topic ?? session.topic}
              stage={nextStage}
              folderId={session.folder_id}
            />
          ) : (
            <Link
              href="/"
              className="flex h-12 items-center justify-center rounded-2xl bg-lime-500 font-black text-white shadow-[0_5px_0_#46a302]"
            >
              다른 주제 학습하기
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
