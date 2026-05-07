import { z } from "zod";

export const questionTypeSchema = z.enum([
  "ox",
  "multiple_choice",
  "blank",
  "short_answer",
  "essay",
]);

export const generateStudyRequestSchema = z.object({
  topic: z.string().trim().min(2).max(80),
  normalizedTopic: z.string().trim().min(2).max(80),
  stage: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  folderId: z.string().uuid().nullable().optional(),
  idempotencyKey: z.string().min(8).max(160),
  anonymousId: z.string().min(8).max(120),
});

export const generatedStudySchema = z.object({
  content: z.object({
    topic: z.string(),
    normalizedTopic: z.string(),
    summary: z.string(),
    analogy: z.string(),
    outline: z.array(z.string()),
    concepts: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        example: z.string(),
        misconception: z.string().optional(),
        checkpoint: z.string(),
      }),
    ),
    terms: z.array(
      z.object({
        term: z.string(),
        meaning: z.string(),
      }),
    ),
    keyPoints: z.array(z.string()),
    reviewChecklist: z.array(z.string()),
  }),
  questions: z.array(
    z.object({
      type: questionTypeSchema,
      stage: z.enum(["beginner", "intermediate", "advanced"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      hint: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      explanation: z.string(),
      relatedConcept: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ).length(10),
});

export const gradeStudyRequestSchema = z.object({
  sessionId: z.string().uuid(),
  stage: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  anonymousId: z.string().min(8).max(120),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      answer: z.string(),
    }),
  ),
  hintUsage: z.array(
    z.object({
      questionId: z.string().uuid(),
      usedHint: z.boolean(),
    }),
  ).default([]),
});

export const topicValidationRequestSchema = z.object({
  topic: z.string().trim().min(2).max(80),
});

export const createFolderRequestSchema = z.object({
  anonymousId: z.string().min(8).max(120),
  name: z.string().trim().min(1).max(40),
});

export const listFolderRequestSchema = z.object({
  anonymousId: z.string().min(8).max(120),
});

export const listStudySessionsRequestSchema = z.object({
  anonymousId: z.string().min(8).max(120),
  folderId: z.string().uuid().nullable().optional(),
});

export const listWrongNotesRequestSchema = z.object({
  anonymousId: z.string().min(8).max(120),
  status: z.enum(["open", "reviewed", "archived", "all"]).default("open"),
  topic: z.string().trim().max(80).nullable().optional(),
  dueOnly: z.boolean().default(false),
});

export const reviewWrongNoteRequestSchema = z.object({
  anonymousId: z.string().min(8).max(120),
  noteId: z.string().uuid(),
  status: z.enum(["open", "reviewed", "archived"]).default("reviewed"),
});

export const sourceSearchRequestSchema = z.object({
  topic: z.string().trim().min(2).max(80),
  normalizedTopic: z.string().trim().min(2).max(80).optional(),
  anonymousId: z.string().min(8).max(120).optional(),
  sessionId: z.string().uuid().optional(),
});
