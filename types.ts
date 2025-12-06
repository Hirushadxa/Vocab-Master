
export enum Theme {
  A2 = "A2 Wortschatz",
  B1 = "B1 Wortschatz",
  B2 = "B2 Wortschatz"
}

export interface VocabItem {
  id: string;
  german: string;
  english: string;
  theme: Theme;
  level: 'A2' | 'B1' | 'B2';
  example: string;
  synonyms?: string;
  article?: string; // der/die/das/none
  plural?: string;
  preposition?: string; // for verbs
  case?: string; // +A or +D
  type: 'noun' | 'verb' | 'connector' | 'preposition' | 'other';
}

export interface StudySession {
  box: number; // 0 (new) to 5 (mastered)
  nextReview: number; // Timestamp in ms
  lastReview: number; // Timestamp in ms
}

export interface UserProgress {
  [vocabId: string]: StudySession;
}
