"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SourcePanel } from "@/components/sources/SourcePanel";
import { StudyContent, StudySource } from "@/types/study";

type BookPage = {
  title: string;
  eyebrow: string;
  body: string[];
};

export function BookReader({
  sessionId,
  content,
  sources,
}: {
  sessionId: string;
  content: StudyContent;
  sources: StudySource[];
}) {
  const pages = useMemo<BookPage[]>(() => {
    const conceptPages = content.concepts.map((concept) => ({
      eyebrow: "핵심 개념",
      title: concept.title,
      body: [
        concept.description,
        `예시: ${concept.example}`,
        concept.misconception ? `헷갈리기 쉬운 점: ${concept.misconception}` : "",
        `체크포인트: ${concept.checkpoint}`,
      ].filter(Boolean),
    }));

    return [
      {
        eyebrow: "표지",
        title: content.topic,
        body: [content.summary],
      },
      {
        eyebrow: "개요",
        title: "왜 배워야 할까요?",
        body: [content.analogy, ...content.keyPoints],
      },
      {
        eyebrow: "학습 목차",
        title: "오늘 볼 내용",
        body: content.outline,
      },
      ...conceptPages,
      {
        eyebrow: "용어 사전",
        title: "꼭 알아둘 말",
        body: content.terms.map((term) => `${term.term}: ${term.meaning}`),
      },
      {
        eyebrow: "복습 체크",
        title: "문제 풀기 전 확인",
        body: content.reviewChecklist,
      },
      {
        eyebrow: "출처",
        title: "참고한 자료",
        body:
          sources.length > 0
            ? sources.map(
                (source) =>
                  `${source.title} · ${source.sourceType} · 신뢰도 ${source.reliability}`,
              )
            : ["아직 저장된 출처가 없습니다. 새로 생성되는 학습부터 출처 후보가 저장됩니다."],
      },
    ];
  }, [content, sources]);
  const [pageIndex, setPageIndex] = useState(0);
  const currentPage = pages[pageIndex];
  const nextPage = pages[pageIndex + 1];

  function movePage(direction: -1 | 1) {
    setPageIndex((index) =>
      Math.min(pages.length - 1, Math.max(0, index + direction)),
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[32px] border-2 border-yellow-100 bg-white p-5 shadow-[0_10px_0_#fde68a] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-yellow-700">백과사전 리더</p>
            <h1 className="mt-1 text-3xl font-black">{content.topic}</h1>
          </div>
          <Link
            href={`/quiz/${sessionId}`}
            className="rounded-2xl bg-lime-500 px-4 py-3 text-sm font-black text-white shadow-[0_5px_0_#46a302]"
          >
            문제 풀기
          </Link>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {[currentPage, nextPage].filter(Boolean).map((page, index) => (
            <article
              key={`${page.title}-${index}`}
              className="min-h-[360px] rounded-[28px] border-2 border-yellow-100 bg-yellow-50 p-6 shadow-inner"
            >
              <p className="text-sm font-black text-yellow-800">{page.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-black leading-8">{page.title}</h2>
              <div className="mt-5 space-y-3">
                {page.body.map((line) => (
                  <p
                    key={line}
                    className="rounded-2xl bg-white/75 p-4 text-sm font-bold leading-7 text-slate-700"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => movePage(-1)}
            disabled={pageIndex === 0}
            className="h-12 rounded-2xl border-2 border-slate-200 bg-white px-5 font-black text-slate-800 disabled:text-slate-400"
          >
            이전 페이지
          </button>
          <p className="text-sm font-black text-slate-500">
            {pageIndex + 1} / {pages.length}
          </p>
          {pageIndex >= pages.length - 1 ? (
            <Link
              href={`/quiz/${sessionId}`}
              className="flex h-12 items-center justify-center rounded-2xl bg-lime-500 px-5 font-black text-white shadow-[0_5px_0_#46a302]"
            >
              문제로 이동
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => movePage(1)}
              className="h-12 rounded-2xl bg-yellow-300 px-5 font-black text-slate-950 shadow-[0_5px_0_#d9a900]"
            >
              다음 페이지
            </button>
          )}
        </div>

        <SourcePanel sources={sources} />
      </section>
    </div>
  );
}
