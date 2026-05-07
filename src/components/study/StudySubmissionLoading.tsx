"use client";

export function StudySubmissionLoading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sky-50/95 px-5 text-slate-950 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[32px] border-2 border-sky-100 bg-white p-6 text-center shadow-[0_12px_0_#c8e9fb] sm:p-8">
        <div className="grading-loader mx-auto" aria-hidden="true">
          <div className="grading-loader-sheet">
            <span />
            <span />
            <span />
          </div>
          <div className="grading-loader-pencil" />
          <div className="grading-loader-badge">점수</div>
        </div>

        <p className="mt-8 text-sm font-black text-sky-700">채점 중</p>
        <h1 className="mt-2 text-2xl font-black">답변을 확인하고 있어요</h1>
        <p className="mt-3 break-keep text-base font-bold leading-7 text-slate-600">
          객관식은 바로 확인하고, 서술형은 채점 기준에 맞춰 꼼꼼히 평가하는
          중입니다.
        </p>
      </section>
    </div>
  );
}
