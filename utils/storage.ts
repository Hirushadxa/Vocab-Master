
import { UserProgress, StudySession, VocabItem } from '../types';

const STORAGE_KEY = 'goethe_b2_progress_v1';

export const getProgress = (): UserProgress => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const saveProgress = (progress: UserProgress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const updateWordProgress = (
  id: string,
  rating: 'fail' | 'hard' | 'good' | 'easy'
): void => {
  const progress = getProgress();
  const current = progress[id] || { box: 0, nextReview: 0, lastReview: 0 };
  
  let newBox = current.box;
  let interval = 0; // Days until next review (converted to ms later)

  // Simplified Spaced Repetition Logic (Leitner System-ish)
  switch (rating) {
    case 'fail':
      newBox = 0; // Reset to Box 0 (New/Difficult)
      interval = 0; // Review immediately/today
      break;
    case 'hard':
      newBox = Math.max(0, current.box - 1); // Stay or go back slightly
      interval = 1; // 1 day
      break;
    case 'good':
      newBox = current.box + 1;
      interval = getIntervalForBox(newBox);
      break;
    case 'easy':
      newBox = current.box + 2;
      interval = getIntervalForBox(newBox);
      break;
  }

  // Cap the box at 5
  if (newBox > 5) newBox = 5;

  const now = Date.now();
  const nextReview = now + (interval * 24 * 60 * 60 * 1000);

  const updatedSession: StudySession = {
    box: newBox,
    lastReview: now,
    nextReview: nextReview
  };

  progress[id] = updatedSession;
  saveProgress(progress);
};

const getIntervalForBox = (box: number): number => {
  switch (box) {
    case 0: return 0; // 0 days (Review immediately/daily)
    case 1: return 1;
    case 2: return 3;
    case 3: return 7;
    case 4: return 14;
    case 5: return 30;
    default: return 1;
  }
};

/**
 * Sorts vocabulary items based on Spaced Repetition priority.
 * Priority 1: Overdue items (nextReview <= now)
 * Priority 2: New items (no progress yet)
 * Priority 3: Items due in the future (sorted by nextReview date)
 */
export const getSRSPriorityQueue = (items: VocabItem[]): VocabItem[] => {
  const progress = getProgress();
  const now = Date.now();

  return [...items].sort((a, b) => {
    const progA = progress[a.id];
    const progB = progress[b.id];

    const isDueA = progA && progA.nextReview <= now;
    const isDueB = progB && progB.nextReview <= now;
    
    const isNewA = !progA || progA.box === 0;
    const isNewB = !progB || progB.box === 0;

    // 1. Due items come first
    if (isDueA && !isDueB) return -1;
    if (!isDueA && isDueB) return 1;

    // 2. If both are due, sort by which was due longest ago (smaller timestamp first)
    if (isDueA && isDueB) return progA.nextReview - progB.nextReview;

    // 3. New items (Box 0 or undefined) come next
    if (isNewA && !isNewB) return -1;
    if (!isNewA && isNewB) return 1;

    // 4. If both are future reviews, sort by nextReview date (sooner first)
    if (progA && progB) return progA.nextReview - progB.nextReview;

    return 0;
  });
};
