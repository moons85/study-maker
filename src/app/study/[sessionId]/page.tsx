import Link from "next/link";

import { SourcePanel } from "@/components/sources/SourcePanel";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Level, StudyContent, StudySource } from "@/types/study";

const stageLabels: Record<Level, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

export default async function StudyPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const studyData = await loadStudyData(sessionId);

  if (studyData.status === "setup-error") {
    return <SetupState message={studyData.message} />;
  }

  if (studyData.status === "not-found") {
    return <NotFoundState />;
  }

  const { session, count, content, sources } = studyData;

  return (
    <main className="min-h-screen px-5 py-6 text-slate-950 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm"
          >
            홈으로
          </Link>
          <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-black text-purple-700">
            {stageLabels[session.current_stage as Level]} · 문제 {count ?? 0}개
          </span>
        </div>

        <div className="app-card overflow-hidden p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_250px] lg:items-center">
            <div>
              <p className="mb-2 text-sm font-black text-lime-700">오늘의 개념</p>
              <h1 className="text-3xl font-black leading-tight sm:text-5xl">
                {content.topic}
              </h1>
              <p className="mt-4 rounded-[24px] bg-lime-50 p-4 text-base font-bold leading-7 text-slate-800">
                {content.summary}
              </p>
              <p className="mt-3 rounded-[24px] bg-sky-50 p-4 text-base font-bold leading-7 text-slate-800">
                쉽게 말하면: {content.analogy}
              </p>
            </div>
            <div className="rounded-[30px] bg-gradient-to-b from-white to-yellow-50 p-4">
              <div className="study-mascot scale-90" aria-hidden="true">
                <div className="study-mascot-spark study-mascot-spark-a">개</div>
                <div className="study-mascot-spark study-mascot-spark-b">념</div>
                <div className="study-mascot-spark study-mascot-spark-c">✓</div>
                <div className="study-mascot-body">
                  <div className="study-mascot-face" />
                </div>
                <div className="study-mascot-book" />
              </div>
            </div>
          </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-lg font-black">학습 목차</h2>
            <ul className="space-y-2">
              {content.outline.map((item) => (
                <li key={item} className="rounded-[20px] bg-white p-3 font-bold shadow-sm">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-black">핵심 포인트</h2>
            <ul className="space-y-2">
              {content.keyPoints.map((item) => (
                <li key={item} className="rounded-[20px] bg-white p-3 font-bold shadow-sm">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-black">핵심 개념</h2>
          <div className="grid gap-3">
            {content.concepts.map((concept) => (
              <article
                key={concept.title}
                className="rounded-[24px] border-2 border-slate-100 bg-white/80 p-4 shadow-sm"
              >
                <h3 className="font-black">{concept.title}</h3>
                <p className="mt-2 leading-7 text-slate-700">
                  {concept.description}
                </p>
                {concept.example ? (
                  <p className="mt-2 text-sm text-slate-500">
                    예시: {concept.example}
                  </p>
                ) : null}
                {concept.misconception ? (
                  <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                    헷갈리기 쉬운 점: {concept.misconception}
                  </p>
                ) : null}
                <p className="mt-2 rounded-xl bg-lime-50 p-3 text-sm font-bold leading-6 text-lime-900">
                  체크포인트: {concept.checkpoint}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[24px] bg-yellow-50 p-4">
          <h2 className="mb-3 text-lg font-black">문제 풀기 전 체크</h2>
          <ul className="space-y-2 text-sm font-bold leading-6 text-slate-800">
            {content.reviewChecklist.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>

        <SourcePanel sources={sources} />

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href={`/encyclopedia/${sessionId}`}
            className="flex h-14 items-center justify-center rounded-[20px] border-2 border-yellow-200 bg-yellow-50 px-5 font-black text-yellow-900"
          >
            책처럼 보기
          </Link>
          <Link
            href={`/quiz/${sessionId}`}
            className="app-primary-button flex h-14 items-center justify-center px-5 font-black"
          >
            문제 풀기 시작
          </Link>
        </div>
        </div>
      </section>
    </main>
  );
}

async function loadStudyData(sessionId: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: session } = await supabase
      .from("study_sessions")
      .select("topic, current_stage, unlocked_stage, content")
      .eq("id", sessionId)
      .single();

    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("stage", session?.current_stage ?? "beginner");

    const { data: sourceRows } = await supabase
      .from("study_sources")
      .select("id, session_id, topic, title, url, source_type, reliability, summary, used_for")
      .eq("session_id", sessionId)
      .order("reliability", { ascending: true })
      .order("created_at", { ascending: true });

    if (!session) {
      return { status: "not-found" as const };
    }

    return {
      status: "ok" as const,
      session,
      count,
      content: session.content as StudyContent,
      sources: (sourceRows ?? []).map((source) => ({
        id: source.id,
        sessionId: source.session_id,
        topic: source.topic,
        title: source.title,
        url: source.url,
        sourceType: source.source_type,
        reliability: source.reliability,
        summary: source.summary,
        usedFor: source.used_for ?? [],
      })) as StudySource[],
    };
  } catch (error) {
    return {
      status: "setup-error" as const,
      message: error instanceof Error ? error.message : "",
    };
  }
}

function NotFoundState() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="rounded-lg bg-white p-6 shadow-sm">학습 세션이 없습니다.</div>
    </main>
  );
}

function SetupState({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-5">
      <div className="max-w-lg rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-black">환경 변수 설정이 필요합니다</h1>
        <p className="mt-3 text-slate-600">{message}</p>
      </div>
    </main>
  );
}
