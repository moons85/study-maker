import { BookReader } from "@/components/encyclopedia/BookReader";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { StudyContent, StudySource } from "@/types/study";

export default async function EncyclopediaPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase
    .from("study_sessions")
    .select("content")
    .eq("id", sessionId)
    .single();
  const { data: sourceRows } = await supabase
    .from("study_sources")
    .select("id, session_id, topic, title, url, source_type, reliability, summary, used_for")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-yellow-50 p-5">
        <div className="rounded-2xl bg-white p-6 font-bold shadow-sm">
          학습 책을 찾을 수 없습니다.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-yellow-50 px-5 py-8 text-slate-950 sm:px-8">
      <BookReader
        sessionId={sessionId}
        content={session.content as StudyContent}
        sources={(sourceRows ?? []).map((source) => ({
          id: source.id,
          sessionId: source.session_id,
          topic: source.topic,
          title: source.title,
          url: source.url,
          sourceType: source.source_type,
          reliability: source.reliability,
          summary: source.summary,
          usedFor: source.used_for ?? [],
        })) as StudySource[]}
      />
    </main>
  );
}
