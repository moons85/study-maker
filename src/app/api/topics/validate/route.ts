import { NextResponse } from "next/server";

import { validateTopicLocally } from "@/lib/topic-normalizer";
import { topicValidationRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = topicValidationRequestSchema.parse(await request.json());

    return NextResponse.json(validateTopicLocally(body.topic));
  } catch (error) {
    return NextResponse.json(
      {
        status: "blocked",
        normalizedTopic: "",
        suggestions: [],
        message:
          error instanceof Error ? error.message : "주제 검증에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}

