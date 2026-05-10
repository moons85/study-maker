import Link from "next/link";

import { HomeReviewCard } from "@/components/home/HomeReviewCard";
import { OnboardingGuide } from "@/components/onboarding/OnboardingGuide";
import { TopicForm } from "@/components/study/TopicForm";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-6 text-slate-950 sm:px-8">
      <OnboardingGuide />
      <section className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="pt-2 sm:pt-8">
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-purple-700 shadow-sm">
              AI가 개념부터 문제까지
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-6xl">
              무엇이든 초급부터 차근차근 배워요.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              주제를 입력하면 AI가 개념 정리와 랜덤 10문제를 만들고, 70점
              이상이면 다음 단계가 열립니다. 로그인 없이 저장 폴더로 학습을
              이어갈 수 있습니다.
            </p>

            <div className="mt-10 app-card p-5" data-tour="learning-path">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-lime-700">학습 경로</p>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-700">
                  70점 달성 시 해금
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "초급",
                    desc: "기초 개념 열림",
                    color: "bg-lime-100 text-lime-900",
                    icon: "1",
                  },
                  {
                    label: "중급",
                    desc: "70점 달성 후",
                    color: "bg-sky-100 text-sky-900",
                    icon: "2",
                  },
                  {
                    label: "고급",
                    desc: "응용과 서술",
                    color: "bg-yellow-100 text-yellow-900",
                    icon: "3",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-3xl p-4 text-sm font-black ${item.color}`}
                  >
                    <div className="mb-5 grid h-10 w-10 place-items-center rounded-2xl bg-white text-base shadow-sm">
                      {item.icon}
                    </div>
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
                className="rounded-[24px] border-2 border-sky-100 bg-white p-5 shadow-[0_6px_0_#bae6fd]"
              >
                <p className="text-sm font-black text-sky-700">최근 학습</p>
                <h2 className="mt-2 text-xl font-black">저장한 학습 열기</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                  폴더별로 만든 주제를 다시 확인합니다.
                </p>
              </Link>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="app-card overflow-hidden p-5 sm:p-6">
              <div className="study-mascot" aria-hidden="true">
                <div className="study-mascot-spark study-mascot-spark-a">?</div>
                <div className="study-mascot-spark study-mascot-spark-b">A</div>
                <div className="study-mascot-spark study-mascot-spark-c">10</div>
                <div className="study-mascot-body">
                  <div className="study-mascot-face" />
                </div>
                <div className="study-mascot-book" />
              </div>
            </div>
            <div className="app-card p-5 sm:p-6">
              <TopicForm />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
