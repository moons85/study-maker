import { QuizForm } from "@/components/study/QuizForm";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { Level, QuestionType } from "@/types/study";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = getSupabaseAdmin();
  const { data: session } = await supabase
    .from("study_sessions")
    .select("current_stage")
    .eq("id", sessionId)
    .single();
  const stage = (session?.current_stage ?? "beginner") as Level;
  const { data: questions } = await supabase
    .from("questions")
    .select("id, type, stage, question, options, hint")
    .eq("session_id", sessionId)
    .eq("stage", stage)
    .order("order_no", { ascending: true });

  return (
    <main className="min-h-screen px-5 py-8 text-slate-950">
      <QuizForm
        sessionId={sessionId}
        stage={stage}
        questions={(questions ?? []).map((question) => ({
          id: question.id,
          type: question.type as QuestionType,
          stage: question.stage as Level,
          question: question.question,
          options: Array.isArray(question.options)
            ? question.options.map(String)
            : null,
          hint: question.hint ?? "문제의 핵심 개념을 다시 떠올려 보세요.",
        }))}
      />
    </main>
  );
}
