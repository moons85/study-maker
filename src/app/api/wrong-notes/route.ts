import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { listWrongNotesRequestSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = listWrongNotesRequestSchema.parse({
      anonymousId: searchParams.get("anonymousId"),
      status: searchParams.get("status") ?? "open",
      topic: searchParams.get("topic") || null,
      dueOnly: searchParams.get("dueOnly") === "true",
    });

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("wrong_notes")
      .select(
        "id, session_id, question_id, topic, stage, question_type, question, user_answer, correct_answer, explanation, related_concept, mistake_type, hint_used, review_count, status, next_review_at, created_at",
      )
      .eq("anonymous_id", body.anonymousId)
      .order("next_review_at", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100);

    if (body.status !== "all") {
      query = query.eq("status", body.status);
    }

    if (body.topic) {
      query = query.eq("topic", body.topic);
    }

    if (body.dueOnly) {
      query = query.lte("next_review_at", new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ wrongNotes: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "오답노트 조회 실패" },
      { status: 400 },
    );
  }
}
