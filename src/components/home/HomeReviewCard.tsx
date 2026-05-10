"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getAnonymousId } from "@/lib/anonymous-id";

type ReviewSummary = {
  dueCount: number;
  openCount: number;
  upcomingCount: number;
  weakConcepts: Array<{
    concept: string;
    count: number;
  }>;
};

export function HomeReviewCard() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    const anonymousId = getAnonymousId();

    fetch(`/api/review/summary?anonymousId=${encodeURIComponent(anonymousId)}`)
      .then((response) => response.json())
      .then((data: ReviewSummary) => setSummary(data))
      .catch(() => setSummary(null));
  }, []);

  return (
    <Link
      href="/wrong-notes"
      data-tour="wrong-notes"
      className="rounded-[24px] border-2 border-orange-100 bg-white p-5 shadow-[0_6px_0_#fed7aa]"
    >
      <p className="text-sm font-black text-orange-700">오늘의 복습</p>
      <h2 className="mt-2 text-xl font-black">
        {summary ? `${summary.dueCount}개 복습하기` : "오답노트 다시 보기"}
      </h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
        {summary && summary.weakConcepts.length > 0
          ? `약한 개념: ${summary.weakConcepts
              .map((item) => item.concept)
              .join(", ")}`
          : "틀린 문제와 약한 개념을 모아 복습합니다."}
      </p>
      {summary ? (
        <p className="mt-3 text-xs font-black text-orange-600">
          예정 {summary.upcomingCount}개 · 전체 {summary.openCount}개
        </p>
      ) : null}
    </Link>
  );
}
