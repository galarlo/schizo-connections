export type Category = {
  category: string;
  items: string[];
  level: 1 | 2 | 3 | 4;
};

export type Word = {
  word: string;
  level: 1 | 2 | 3 | 4;
  selected?: boolean;
};

export type SubmitResultType =
  | "correct"
  | "incorrect"
  | "same"
  | "one-away"
  | "loss"
  | "win";

export type SubmitResult = {
  result: SubmitResultType;
};

export type CellAnimationState = {
  show: boolean;
  index: number;
};

// Represents a board that can be either a regular (with categories) or random (just words)
export type SchizoBoard =
  | { type: "regular"; categories: Category[] }
  | { type: "random"; words: string[] };
