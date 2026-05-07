import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { reviewWrongNoteRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = reviewWrongNoteRequestSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data: current, error: currentError } = await supabase
      .from("wrong_notes")
      .select("review_count")
      .eq("id", body.noteId)
      .eq("anonymous_id", body.anonymousId)
      .single();

    if (currentError || !current) {
      throw currentError ?? new Error("오답노트를 찾을 수 없습니다.");
    }

    const nextReviewCount = (current.review_count ?? 0) + 1;
    const nextStatus = body.status === "reviewed" ? "open" : body.status;
    const nextReviewAt = new Date(
      Date.now() + Math.min(14, 2 ** nextReviewCount) * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("wrong_notes")
      .update({
        status: nextStatus,
        review_count: nextReviewCount,
        next_review_at: nextReviewAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.noteId)
      .eq("anonymous_id", body.anonymousId)
      .select("id, status, review_count, next_review_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ wrongNote: data });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "오답노트 업데이트 실패" },
      { status: 400 },
    );
  }
}
