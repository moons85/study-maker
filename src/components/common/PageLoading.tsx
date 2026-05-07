export function PageLoading({
  title = "페이지를 준비하고 있어요",
  description = "필요한 학습 정보를 불러오는 중입니다.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="min-h-screen bg-lime-50 px-5 py-10 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-3xl rounded-[28px] border-2 border-lime-100 bg-white p-5 shadow-[0_10px_0_#d7e7c8] sm:p-8">
        <div className="flex items-center gap-4">
          <div className="page-loader-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p className="text-sm font-black text-lime-700">AI Study Maker</p>
            <h1 className="mt-1 text-2xl font-black">{title}</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-3">
          <div className="h-5 w-2/3 rounded-full bg-lime-100 page-loader-pulse" />
          <div className="h-5 w-full rounded-full bg-sky-100 page-loader-pulse" />
          <div className="h-5 w-5/6 rounded-full bg-yellow-100 page-loader-pulse" />
        </div>
      </section>
    </main>
  );
}
