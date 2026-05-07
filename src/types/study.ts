export type Level = "beginner" | "intermediate" | "advanced";

export type QuestionType =
  | "ox"
  | "multiple_choice"
  | "blank"
  | "short_answer"
  | "essay";

export type Difficulty = "easy" | "medium" | "hard";

export type TopicValidationStatus =
  | "ok"
  | "needs_confirmation"
  | "too_broad"
  | "blocked";

export type StudyFolder = {
  id: string;
  name: string;
  color: string;
  icon: string;
  systemType: "all" | "recent" | "favorite" | "wrong_review" | "custom";
};

export type StudySource = {
  id?: string;
  sessionId?: string | null;
  topic: string;
  title: string;
  url: string;
  sourceType: "official" | "encyclopedia" | "lecture" | "community";
  reliability: "high" | "medium" | "low";
  summary?: string | null;
  usedFor: string[];
};

export type StudyContent = {
  topic: string;
  normalizedTopic: string;
  summary: string;
  analogy: string;
  outline: string[];
  concepts: Array<{
    title: string;
    description: string;
    example: string;
    misconception?: string;
    checkpoint: string;
  }>;
  terms: Array<{
    term: string;
    meaning: string;
  }>;
  keyPoints: string[];
  reviewChecklist: string[];
};

export type Question = {
  id: string;
  type: QuestionType;
  stage: Level;
  question: string;
  options?: string[];
  hint: string;
  answer: string | string[];
  explanation: string;
  relatedConcept: string;
  difficulty: Difficulty;
};

export type GeneratedQuestion = Omit<Question, "id">;

export type GeneratedStudy = {
  content: StudyContent;
  questions: GeneratedQuestion[];
};

export type AnswerPayload = {
  questionId: string;
  answer: string;
};

export type HintUsagePayload = {
  questionId: string;
  usedHint: boolean;
};

export type GradedResult = {
  questionId: string;
  isCorrect: boolean;
  score: number;
  userAnswer: string;
  correctAnswer: string | string[];
  explanation: string;
  feedback?: string;
};

export function getNextStage(stage: Level): Level | null {
  if (stage === "beginner") return "intermediate";
  if (stage === "intermediate") return "advanced";
  return null;
}
