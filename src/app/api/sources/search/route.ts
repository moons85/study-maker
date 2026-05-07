import { NextResponse } from "next/server";

import {
  collectSourceCandidates,
  toSourceRows,
} from "@/lib/source-candidates";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sourceSearchRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = sourceSearchRequestSchema.parse(await request.json());
    const topic = body.normalizedTopic ?? body.topic;
    const sources = await collectSourceCandidates(topic);

    if (body.sessionId) {
      if (!body.anonymousId) {
        throw new Error("세션에 출처를 저장하려면 anonymousId가 필요합니다.");
      }

      const supabase = getSupabaseAdmin();
      const { data: session, error: sessionError } = await supabase
        .from("study_sessions")
        .select("id")
        .eq("id", body.sessionId)
        .eq("anonymous_id", body.anonymousId)
        .single();

      if (sessionError || !session) {
        throw sessionError ?? new Error("학습 세션을 찾을 수 없습니다.");
      }

      const { error } = await supabase
        .from("study_sources")
        .upsert(toSourceRows({ sessionId: body.sessionId, sources }), {
          onConflict: "session_id,url",
        });

      if (error) throw error;
    }

    return NextResponse.json({ sources });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "출처 조회 실패" },
      { status: 400 },
    );
  }
}
