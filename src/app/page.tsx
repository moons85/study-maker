import Link from "next/link";

import { HomeReviewCard } from "@/components/home/HomeReviewCard";
import { TopicForm } from "@/components/study/TopicForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-lime-50 px-5 py-8 text-slate-950 sm:px-8">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="pt-4 sm:pt-10">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-slate-900 bg-lime-500 shadow-[0_5px_0_#46a302]">
                <div className="relative h-7 w-8">
                  <div className="absolute left-0 top-1 h-6 w-4 rounded-l-md border-2 border-white bg-white/20" />
                  <div className="absolute right-0 top-1 h-6 w-4 rounded-r-md border-2 border-white bg-white/20" />
                  <div className="absolute -right-2 -top-1 grid h-5 w-5 place-items-center rounded-full bg-yellow-300 text-[10px] font-black text-slate-950">
                    ✓
                  </div>
                </div>
              </div>
              <p className="text-sm font-black text-lime-700">AI Study Maker</p>
            </div>
            <Link
              href="/library"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm"
            >
              내 학습 보기
            </Link>
            <Link
              href="/wrong-notes"
              className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-800 shadow-sm"
            >
              오답노트
            </Link>
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
            무엇이든 초급부터 차근차근 배워요.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            주제를 입력하면 AI가 개념 정리와 랜덤 10문제를 만들고, 70점
            이상이면 다음 단계가 열립니다. 로그인 없이 저장 폴더로 학습을
            이어갈 수 있습니다.
          </p>

          <div className="mt-10 rounded-[28px] border-2 border-lime-100 bg-white p-5 shadow-[0_8px_0_#d7e7c8]">
            <p className="text-sm font-black text-lime-700">학습 경로</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: "초급", desc: "기초 개념 열림", color: "bg-lime-100 text-lime-900" },
                { label: "중급", desc: "70점 달성 후", color: "bg-sky-100 text-sky-900" },
                { label: "고급", desc: "응용과 서술", color: "bg-yellow-100 text-yellow-900" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl p-4 text-sm font-black ${item.color}`}
                >
                  <div className="text-xl">{item.label}</div>
                  <p className="mt-2 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <HomeReviewCard />
            <Link
              href="/library"
              className="rounded-2xl border-2 border-sky-100 bg-white p-5 shadow-[0_6px_0_#bae6fd]"
            >
              <p className="text-sm font-black text-sky-700">최근 학습</p>
              <h2 className="mt-2 text-xl font-black">저장한 학습 열기</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                폴더별로 만든 주제를 다시 확인합니다.
              </p>
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border-2 border-lime-100 bg-white p-5 shadow-[0_10px_0_#d7e7c8] sm:p-6">
          <TopicForm />
        </div>
      </section>
    </main>
  );
}
