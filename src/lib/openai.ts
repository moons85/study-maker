import OpenAI from "openai";

import { getRequiredEnv } from "@/lib/env";

export function getOpenAI() {
  return new OpenAI({
    apiKey: getRequiredEnv("OPENAI_API_KEY"),
  });
}

