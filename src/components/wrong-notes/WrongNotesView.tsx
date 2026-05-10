"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAnonymousId } from "@/lib/anonymous-id";
import { Level } from "@/types/study";

type WrongNote = {
  id: string;
  session_id: string;
  question_id: string;
  topic: string;
  stage: Level;
  question_type: string;
  question: string;
  user_answer: string;
  correct_answer: string | string[];
  explanation: string;
  related_concept: string | null;
  mistake_type: string;
  hint_used: boolean;
  review_count: number;
  status: "open" | "reviewed" | "archived";
  next_review_at: string;
  created_at: string;
};

const stageLabels: Record<Level, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const mistakeLabels: Record<string, string> = {
  concept_gap: "개념 부족",
  condition_misread: "조건 오해",
  careless: "단순 실수",
  essay_incomplete: "서술형 보완",
  term_confusion: "용어 혼동",
};

function formatAnswer(answer: string | string[]) {
  return Array.isArray(answer) ? answer.join(", ") : String(answer ?? "");
}

export function WrongNotesView() {
  const [wrongNotes, setWrongNotes] = useState<WrongNote[]>([]);
  const [filter, setFilter] = useState<"due" | "open" | "all">("due");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const weakConcepts = useMemo(() => {
    const counts = new Map<string, number>();
    wrongNotes.forEach((note) => {
      if (!note.related_concept) return;
      counts.set(note.related_concept, (counts.get(note.related_concept) ?? 0) + 1);
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concept]) => concept);
  }, [wrongNotes]);

  useEffect(() => {
    const anonymousId = getAnonymousId();

    fetch(
      `/api/wrong-notes?anonymousId=${encodeURIComponent(anonymousId)}&status=${
        filter === "all" ? "all" : "open"
      }&dueOnly=${filter === "due"}`,
    )
      .then((response) => response.json())
      .then((data: { wrongNotes?: WrongNote[]; message?: string }) => {
        if (data.message) throw new Error(data.message);
        setWrongNotes(data.wrongNotes ?? []);
      })
      .catch((fetchError) => {
        setWrongNotes([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "오답노트를 불러오지 못했습니다.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [filter]);

  async function markReviewed(noteId: string) {
    const response = await fetch("/api/wrong-notes/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousId: getAnonymousId(),
        noteId,
        status: "reviewed",
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string };
      setError(data.message ?? "복습 완료 처리에 실패했습니다.");
      return;
    }

    setWrongNotes((current) => current.filter((note) => note.id !== noteId));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[30px] border-2 border-orange-100 bg-white p-5 shadow-[0_10px_0_#fed7aa] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-orange-600">오답노트</p>
            <h1 className="mt-2 text-3xl font-black">다시 보면 강해지는 문제들</h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              틀린 문제, 내 답변, 정답, 해설, 관련 개념을 모아 복습합니다.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-2xl bg-lime-500 px-4 py-3 text-sm font-black text-white shadow-[0_5px_0_#46a302]"
          >
            새 학습 만들기
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-sm font-black text-orange-800">복습 대상</p>
            <p className="mt-2 text-3xl font-black">{wrongNotes.length}개</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4 md:col-span-2">
            <p className="text-sm font-black text-sky-800">약한 개념</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
              {weakConcepts.length > 0
                ? weakConcepts.join(", ")
                : "오답이 쌓이면 자주 틀리는 개념을 보여줍니다."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { value: "due", label: "오늘 복습" },
            { value: "open", label: "예정 포함" },
            { value: "all", label: "전체" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setIsLoading(true);
                setError("");
                setFilter(item.value as "due" | "open" | "all");
              }}
              className={`rounded-full px-4 py-2 text-sm font-black ${
                filter === item.value
                  ? "bg-orange-400 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6 grid gap-4">
        {isLoading ? (
          <div className="rounded-2xl bg-white p-5 font-bold text-slate-600">
            오답노트를 불러오는 중입니다.
          </div>
        ) : wrongNotes.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 font-bold text-slate-600">
            {filter === "due"
              ? "오늘 복습할 오답이 없습니다."
              : "아직 표시할 오답이 없습니다."}
          </div>
        ) : (
          wrongNotes.map((note) => (
            <article
              key={note.id}
              className="rounded-[24px] border-2 border-orange-100 bg-white p-5 shadow-[0_6px_0_#fed7aa]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">
                    {stageLabels[note.stage]}
                  </span>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-900">
                    {mistakeLabels[note.mistake_type] ?? "오답"}
                  </span>
                  {note.hint_used ? (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-900">
                      힌트 사용
                    </span>
                  ) : null}
                </div>
                <p className="text-xs font-bold text-slate-400">
                  다음 복습 {new Date(note.next_review_at).toLocaleDateString("ko-KR")}
                </p>
              </div>

              <h2 className="mt-4 text-lg font-black leading-7">{note.question}</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-sm font-black text-red-700">내 답변</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                    {note.user_answer || "답변 없음"}
                  </p>
                </div>
                <div className="rounded-2xl bg-lime-50 p-4">
                  <p className="text-sm font-black text-lime-800">정답</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                    {formatAnswer(note.correct_answer)}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">해설</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {note.explanation}
                </p>
                {note.related_concept ? (
                  <p className="mt-3 text-sm font-black text-sky-700">
                    관련 개념: {note.related_concept}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Link
                  href={`/study/${note.session_id}`}
                  className="flex h-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-800"
                >
                  개념 다시 보기
                </Link>
                <Link
                  href={`/quiz/${note.session_id}`}
                  className="flex h-12 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white font-black text-slate-800"
                >
                  다시 풀기
                </Link>
                {note.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => markReviewed(note.id)}
                    className="h-12 rounded-2xl bg-orange-400 font-black text-white shadow-[0_5px_0_#c76a00]"
                  >
                    오늘 복습 완료
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
