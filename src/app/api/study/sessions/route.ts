import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { listStudySessionsRequestSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = listStudySessionsRequestSchema.parse({
      anonymousId: searchParams.get("anonymousId"),
      folderId: searchParams.get("folderId") || null,
    });

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("study_sessions")
      .select(
        "id, folder_id, topic, normalized_topic, current_stage, unlocked_stage, created_at",
      )
      .eq("anonymous_id", body.anonymousId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (body.folderId) {
      query = query.eq("folder_id", body.folderId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ sessions: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "학습 목록 조회 실패" },
      { status: 400 },
    );
  }
}
