"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAnonymousId } from "@/lib/anonymous-id";
import { Level, QuestionType } from "@/types/study";

import { StudySubmissionLoading } from "./StudySubmissionLoading";

type QuizQuestion = {
  id: string;
  type: QuestionType;
  stage: Level;
  question: string;
  options?: string[] | null;
  hint: string;
};

const typeLabels: Record<QuestionType, string> = {
  ox: "OX",
  multiple_choice: "객관식",
  blank: "빈칸",
  short_answer: "주관식",
  essay: "서술형",
};

export function QuizForm({
  sessionId,
  stage,
  questions,
}: {
  sessionId: string;
  stage: Level;
  questions: QuizQuestion[];
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hintUsage, setHintUsage] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentQuestion = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  function updateAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  function showHint(questionId: string) {
    setHintUsage((current) => ({ ...current, [questionId]: true }));
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  async function handleGradeClick() {
    setError("");

    if (currentIndex !== questions.length - 1) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/study/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          stage,
          anonymousId: getAnonymousId(),
          answers: questions.map((question) => ({
            questionId: question.id,
            answer: answers[question.id] ?? "",
          })),
          hintUsage: questions.map((question) => ({
            questionId: question.id,
            usedHint: hintUsage[question.id] ?? false,
          })),
        }),
      });

      const data = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "채점에 실패했습니다.");
      }

      router.push(`/result/${sessionId}`);
    } catch (submitError) {
      setIsSubmitting(false);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "채점 중 오류가 발생했습니다.",
      );
    }
  }

  if (!currentQuestion) {
    return <p>문제가 없습니다.</p>;
  }

  const options =
    currentQuestion.type === "ox"
      ? ["O", "X"]
      : currentQuestion.options ?? [];

  return (
    <>
      {isSubmitting ? <StudySubmissionLoading /> : null}
      <form
        onSubmit={handleFormSubmit}
        className="app-card mx-auto max-w-2xl p-5 sm:p-7"
      >
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between text-sm font-bold">
          <span className="text-lime-700">
            {stage === "beginner" ? "초급" : stage === "intermediate" ? "중급" : "고급"} · 문제 {currentIndex + 1} / {questions.length}
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
            {typeLabels[currentQuestion.type]}
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-lime-100 shadow-inner">
          <div
            className="h-full rounded-full bg-lime-300 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <section className="mb-7 rounded-[28px] bg-gradient-to-br from-white to-lime-50 p-5 shadow-sm">
        <p className="mb-3 text-xs font-black uppercase text-lime-700">
          Question
        </p>
        <h1 className="text-2xl font-black leading-snug text-slate-950">
          {currentQuestion.question}
        </h1>
      </section>

      <div className="mb-5">
        {hintUsage[currentQuestion.id] ? (
          <div className="rounded-2xl bg-yellow-100 p-4 text-sm font-bold leading-6 text-slate-800">
            힌트: {currentQuestion.hint}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => showHint(currentQuestion.id)}
            className="app-yellow-button px-4 py-3 text-sm font-black"
          >
            힌트 보기
          </button>
        )}
      </div>

      {["ox", "multiple_choice"].includes(currentQuestion.type) ? (
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateAnswer(currentQuestion.id, option)}
            className={`w-full rounded-[22px] border-2 p-4 text-left text-base font-black transition ${
                answers[currentQuestion.id] === option
                  ? "border-lime-500 bg-lime-50 text-lime-800 shadow-[0_5px_0_#d7e7c8]"
                  : "border-slate-200 bg-white text-slate-800 shadow-sm"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : currentQuestion.type === "essay" ? (
        <textarea
          value={answers[currentQuestion.id] ?? ""}
          onChange={(event) =>
            updateAnswer(currentQuestion.id, event.target.value)
          }
          className="min-h-44 w-full rounded-[22px] border-2 border-slate-200 p-4 font-bold outline-none placeholder:font-bold placeholder:text-slate-300 focus:border-lime-500"
          placeholder="답변을 입력하세요."
        />
      ) : (
        <input
          value={answers[currentQuestion.id] ?? ""}
          onChange={(event) =>
            updateAnswer(currentQuestion.id, event.target.value)
          }
          className="h-14 w-full rounded-[22px] border-2 border-slate-200 px-4 font-bold outline-none placeholder:font-bold placeholder:text-slate-300 focus:border-lime-500"
          placeholder="답을 입력하세요."
        />
      )}

      {error ? (
        <div className="mt-5 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          disabled={currentIndex === 0}
          className="h-12 rounded-[18px] border-2 border-slate-200 bg-white font-black text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:text-slate-400"
        >
          이전
        </button>
        {currentIndex === questions.length - 1 ? (
          <button
            type="button"
            onClick={handleGradeClick}
            disabled={isSubmitting}
            className="app-primary-button h-12 font-black disabled:bg-slate-400 disabled:shadow-none"
          >
            {isSubmitting ? "채점 중..." : "제출하기"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((index) =>
                Math.min(questions.length - 1, index + 1),
              )
            }
            className="app-primary-button h-12 font-black"
          >
            다음
          </button>
        )}
      </div>
      </form>
    </>
  );
}
