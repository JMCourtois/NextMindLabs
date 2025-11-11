export type FeedbackTone = "neutral" | "success" | "error";

export type SpellingWord = {
  id: string;
  word: string;
  audioUrl: string;
  letters: string[];
  hints?: {
    tip?: string;
  };
};

export type SpellingFeedback = {
  message: string;
  tone: FeedbackTone;
};

