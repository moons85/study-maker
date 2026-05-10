import { createHash } from "crypto";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export type AiUsageAction = "study_generate" | "study_grade";

class UsageLimitError extends Error {
  status = 429;

  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

export function isUsageLimitError(error: unknown): error is UsageLimitError {
  return error instanceof UsageLimitError;
}

function getEnvNumber(name: string, fallback: number) {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function hashIp(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    vercelForwardedFor?.split(",")[0]?.trim() ||
    realIp ||
    "unknown"
  );
}

function getActionLimit(action: AiUsageAction) {
  if (action === "study_generate") {
    return {
      dailyAnonymousLimit: getEnvNumber("DAILY_GENERATION_LIMIT", 3),
      hourlyIpLimit: getEnvNumber("HOURLY_IP_GENERATION_LIMIT", 5),
      dailyMessage: "오늘 생성 가능한 학습 세트를 모두 사용했습니다. 내일 다시 시도해주세요.",
      hourlyMessage: "짧은 시간에 생성 요청이 많습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  return {
    dailyAnonymousLimit: getEnvNumber("DAILY_GRADING_LIMIT", 10),
    hourlyIpLimit: getEnvNumber("HOURLY_IP_GRADING_LIMIT", 20),
    dailyMessage: "오늘 채점 가능한 횟수를 모두 사용했습니다. 내일 다시 시도해주세요.",
    hourlyMessage: "짧은 시간에 채점 요청이 많습니다. 잠시 후 다시 시도해주세요.",
  };
}

export async function assertAndRecordAiUsage({
  request,
  anonymousId,
  action,
  metadata = {},
}: {
  request: Request;
  anonymousId: string;
  action: AiUsageAction;
  metadata?: Record<string, unknown>;
}) {
  const limits = getActionLimit(action);

  if (limits.dailyAnonymousLimit === 0 || limits.hourlyIpLimit === 0) {
    throw new UsageLimitError("현재 AI 사용이 일시적으로 제한되어 있습니다.");
  }

  const supabase = getSupabaseAdmin();
  const ipHash = hashIp(getClientIp(request));
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();

  const { count: dailyCount, error: dailyError } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("anonymous_id", anonymousId)
    .eq("action", action)
    .gte("created_at", dayAgo);

  if (dailyError) throw dailyError;

  if ((dailyCount ?? 0) >= limits.dailyAnonymousLimit) {
    throw new UsageLimitError(limits.dailyMessage);
  }

  const { count: hourlyCount, error: hourlyError } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("action", action)
    .gte("created_at", hourAgo);

  if (hourlyError) throw hourlyError;

  if ((hourlyCount ?? 0) >= limits.hourlyIpLimit) {
    throw new UsageLimitError(limits.hourlyMessage);
  }

  const { error: insertError } = await supabase.from("ai_usage_events").insert({
    anonymous_id: anonymousId,
    ip_hash: ipHash,
    action,
    metadata,
  });

  if (insertError) throw insertError;
}
