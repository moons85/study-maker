import { Level } from "@/types/study";

export function createGenerationCacheKey(normalizedTopic: string, stage: Level) {
  return `${normalizedTopic.trim().toLowerCase()}::${stage}::v3`;
}

export function createGenerationLockKey(
  anonymousId: string,
  normalizedTopic: string,
  stage: Level,
) {
  return `${anonymousId}::${createGenerationCacheKey(normalizedTopic, stage)}`;
}

