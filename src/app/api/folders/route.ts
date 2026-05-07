import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  createFolderRequestSchema,
  listFolderRequestSchema,
} from "@/lib/validation";

const defaultFolders = [
  { name: "전체 학습", system_type: "all", color: "#58CC02", icon: "library" },
  { name: "최근 학습", system_type: "recent", color: "#1CB0F6", icon: "clock" },
  { name: "즐겨찾기", system_type: "favorite", color: "#FFC800", icon: "star" },
  { name: "오답 복습", system_type: "wrong_review", color: "#FF4B4B", icon: "target" },
];

async function ensureDefaultFolders(anonymousId: string) {
  const supabase = getSupabaseAdmin();

  await supabase.from("study_folders").upsert(
    defaultFolders.map((folder) => ({
      ...folder,
      anonymous_id: anonymousId,
    })),
    { onConflict: "anonymous_id,name" },
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = listFolderRequestSchema.parse({
      anonymousId: searchParams.get("anonymousId"),
    });

    await ensureDefaultFolders(body.anonymousId);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("study_folders")
      .select("id, name, color, icon, system_type")
      .eq("anonymous_id", body.anonymousId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ folders: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "폴더 조회 실패" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = createFolderRequestSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("study_folders")
      .insert({
        anonymous_id: body.anonymousId,
        name: body.name,
        system_type: "custom",
        color: "#58CC02",
        icon: "book",
      })
      .select("id, name, color, icon, system_type")
      .single();

    if (error) throw error;

    return NextResponse.json({ folder: data });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "폴더 생성 실패" },
      { status: 400 },
    );
  }
}

