import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/server";

const reviewSummaryRequestSchema = z.object({
  anonymousId: z.string().min(8).max(120),
});

type WrongNoteSummaryRow = {
  related_concept: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = reviewSummaryRequestSchema.parse({
      anonymousId: searchParams.get("anonymousId"),
    });
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { count: dueCount, error: dueError } = await supabase
      .from("wrong_notes")
      .select("id", { count: "exact", head: true })
      .eq("anonymous_id", body.anonymousId)
      .eq("status", "open")
      .lte("next_review_at", now);

    if (dueError) throw dueError;

    const { count: openCount, error: openError } = await supabase
      .from("wrong_notes")
      .select("id", { count: "exact", head: true })
      .eq("anonymous_id", body.anonymousId)
      .eq("status", "open");

    if (openError) throw openError;

    const { count: upcomingCount, error: upcomingError } = await supabase
      .from("wrong_notes")
      .select("id", { count: "exact", head: true })
      .eq("anonymous_id", body.anonymousId)
      .eq("status", "open")
      .gt("next_review_at", now);

    if (upcomingError) throw upcomingError;

    const { data: weakRows, error: weakError } = await supabase
      .from("wrong_notes")
      .select("related_concept")
      .eq("anonymous_id", body.anonymousId)
      .eq("status", "open")
      .not("related_concept", "is", null)
      .limit(100);

    if (weakError) throw weakError;

    const conceptCounts = new Map<string, number>();
    ((weakRows ?? []) as WrongNoteSummaryRow[]).forEach((row) => {
      if (!row.related_concept) return;
      conceptCounts.set(
        row.related_concept,
        (conceptCounts.get(row.related_concept) ?? 0) + 1,
      );
    });

    const weakConcepts = [...conceptCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concept, count]) => ({ concept, count }));

    return NextResponse.json({
      dueCount: dueCount ?? 0,
      openCount: openCount ?? 0,
      upcomingCount: upcomingCount ?? 0,
      weakConcepts,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "복습 요약 조회 실패" },
      { status: 400 },
    );
  }
}
