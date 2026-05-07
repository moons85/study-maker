"use client";

export function StudyGenerationLoading({ topic }: { topic: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-lime-50/95 px-5 text-slate-950 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-[32px] border-2 border-lime-100 bg-white p-6 text-center shadow-[0_12px_0_#d7e7c8] sm:p-8">
        <div className="study-loader-scene mx-auto" aria-hidden="true">
          <div className="study-loader-orbit">
            <span className="study-loader-chip study-loader-chip-a">OX</span>
            <span className="study-loader-chip study-loader-chip-b">힌트</span>
            <span className="study-loader-chip study-loader-chip-c">10</span>
          </div>
          <div className="study-loader-book">
            <div className="study-loader-page study-loader-page-left" />
            <div className="study-loader-page study-loader-page-right" />
            <div className="study-loader-spark study-loader-spark-a" />
            <div className="study-loader-spark study-loader-spark-b" />
            <div className="study-loader-spark study-loader-spark-c" />
          </div>
        </div>

        <p className="mt-8 text-sm font-black text-lime-700">
          AI Study Maker
        </p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
          학습 세트를 만들고 있어요
        </h1>
        <p className="mt-3 break-keep text-base font-bold leading-7 text-slate-600">
          {topic.trim() || "입력한 주제"}에 맞춰 개념 정리와 랜덤 10문제를
          구성하는 중입니다.
        </p>

        <div className="mt-6 grid gap-2 text-left text-sm font-bold text-slate-700">
          {[
            "주제 확인",
            "핵심 개념 정리",
            "힌트가 있는 랜덤 문제 생성",
            "학습 폴더에 저장",
          ].map((item, index) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl bg-lime-50 px-4 py-3"
            >
              <span className="study-loader-dot" style={{ animationDelay: `${index * 0.18}s` }} />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
