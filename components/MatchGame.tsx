
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { VocabItem, Theme } from '../types';
import { PlayIcon, SparklesIcon, FireIcon, LightBulbIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  data: VocabItem[];
  themeFilter: Theme | 'All';
  onComplete: () => void;
}

interface SlotItem {
  vocabId: string;
  text: string;
  type: 'german' | 'english';
  state: 'idle' | 'selected' | 'matched' | 'wrong';
  originalItem: VocabItem; // Store ref to original item for hints
}

const REFILL_DELAY_MS = 5000;
const CHECKPOINT_EVERY = 5;

const MatchGame: React.FC<Props> = ({ data, themeFilter, onComplete }) => {
  // Game State
  const [pool, setPool] = useState<VocabItem[]>([]);
  const [leftSlots, setLeftSlots] = useState<(SlotItem | null)[]>(new Array(5).fill(null));
  const [rightSlots, setRightSlots] = useState<(SlotItem | null)[]>(new Array(5).fill(null));
  
  const [matchesCount, setMatchesCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [failures, setFailures] = useState<Record<string, number>>({});
  
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Hint State
  const [hintData, setHintData] = useState<{word: string, sentence: string} | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Interaction State
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null); // Index
  const [selectedRight, setSelectedRight] = useState<number | null>(null); // Index
  const [wrongPair, setWrongPair] = useState<{l: number, r: number} | null>(null);

  // Refs for managing timeouts
  const timeoutsRef = useRef<number[]>([]);

  // 1. Initialization
  useEffect(() => {
    initGame();
    return () => clearAllTimeouts();
  }, [data, themeFilter]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const initGame = () => {
    const filtered = themeFilter === 'All' 
      ? data 
      : data.filter(item => item.theme === themeFilter);
    
    const shuffledPool = [...filtered].sort(() => Math.random() - 0.5);
    
    const initialPairs = shuffledPool.slice(0, 5);
    const remainingPool = shuffledPool.slice(5);

    const newLeft: (SlotItem | null)[] = new Array(5).fill(null);
    const newRight: (SlotItem | null)[] = new Array(5).fill(null);

    const lIndices = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const rIndices = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);

    initialPairs.forEach((vocab, i) => {
      newLeft[lIndices[i]] = createSlotItem(vocab, 'german');
      newRight[rIndices[i]] = createSlotItem(vocab, 'english');
    });

    setPool(remainingPool);
    setLeftSlots(newLeft);
    setRightSlots(newRight);
    setMatchesCount(0);
    setStreak(0);
    setFailures({});
    setShowCheckpoint(false);
    setIsPaused(false);
    clearAllTimeouts();
  };

  const createSlotItem = (vocab: VocabItem, type: 'german' | 'english'): SlotItem => {
    let text = vocab.german;
    if (type === 'german') {
      if (vocab.type === 'noun' && vocab.article) text = `${vocab.article} ${vocab.german}`;
      if (vocab.type === 'verb' && vocab.preposition) text = `${vocab.german} (${vocab.preposition})`;
    } else {
      text = vocab.english;
    }
    return { vocabId: vocab.id, text, type, state: 'idle', originalItem: vocab };
  };

  // 2. Interaction Logic
  const handleCardClick = (side: 'left' | 'right', index: number) => {
    if (isPaused || wrongPair || isLoadingHint) return;
    
    const slots = side === 'left' ? leftSlots : rightSlots;
    const item = slots[index];

    if (!item || item.state === 'matched') return;

    if (side === 'left') {
      if (selectedLeft === index) {
        setSelectedLeft(null); 
      } else {
        setSelectedLeft(index);
        if (selectedRight !== null) attemptMatch(index, selectedRight);
      }
    } else {
      if (selectedRight === index) {
        setSelectedRight(null); 
      } else {
        setSelectedRight(index);
        if (selectedLeft !== null) attemptMatch(selectedLeft, index);
      }
    }
  };

  const attemptMatch = (lIndex: number, rIndex: number) => {
    const lItem = leftSlots[lIndex];
    const rItem = rightSlots[rIndex];

    if (!lItem || !rItem) return;

    if (lItem.vocabId === rItem.vocabId) {
      handleSuccessMatch(lIndex, rIndex);
    } else {
      handleWrongMatch(lIndex, rIndex);
    }
  };

  const handleSuccessMatch = (lIndex: number, rIndex: number) => {
    updateSlotState('left', lIndex, 'matched');
    updateSlotState('right', rIndex, 'matched');
    setSelectedLeft(null);
    setSelectedRight(null);

    const newCount = matchesCount + 1;
    setMatchesCount(newCount);
    setStreak(s => s + 1);

    if (newCount % CHECKPOINT_EVERY === 0) {
       setTimeout(() => {
         setIsPaused(true);
         setShowCheckpoint(true);
       }, 500);
    }

    const timeoutId = setTimeout(() => {
      refillSlots(lIndex, rIndex);
    }, REFILL_DELAY_MS);
    timeoutsRef.current.push(timeoutId);
  };

  const handleWrongMatch = (lIndex: number, rIndex: number) => {
    // Increment failures
    const lItem = leftSlots[lIndex];
    // We only count failure for the German word (left side). 
    // Counting it for the right side (English) would incorrectly trigger hints for the German card corresponding to that English word.
    
    setFailures(prev => {
        const next = { ...prev };
        if (lItem) next[lItem.vocabId] = (next[lItem.vocabId] || 0) + 1;
        return next;
    });

    setStreak(0); // Reset streak

    setWrongPair({ l: lIndex, r: rIndex });
    updateSlotState('left', lIndex, 'wrong');
    updateSlotState('right', rIndex, 'wrong');

    setTimeout(() => {
      updateSlotState('left', lIndex, 'idle');
      updateSlotState('right', rIndex, 'idle');
      setWrongPair(null);
      setSelectedLeft(null);
      setSelectedRight(null);
    }, 800);
  };

  const updateSlotState = (side: 'left' | 'right', index: number, newState: SlotItem['state']) => {
    const setter = side === 'left' ? setLeftSlots : setRightSlots;
    setter(prev => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index]!, state: newState };
      return next;
    });
  };

  const refillSlots = (lIndex: number, rIndex: number) => {
    setPool(currentPool => {
      let nextPool = [...currentPool];
      let newItem: VocabItem | undefined;

      if (nextPool.length > 0) {
        newItem = nextPool[0]; 
        nextPool = nextPool.slice(1);
      } 
      
      if (!newItem) return nextPool; 

      setLeftSlots(prev => {
        const next = [...prev];
        next[lIndex] = createSlotItem(newItem!, 'german');
        return next;
      });

      setRightSlots(prev => {
        const next = [...prev];
        next[rIndex] = createSlotItem(newItem!, 'english');
        return next;
      });

      return nextPool;
    });
  };

  // --- HINT LOGIC ---
  const handleHintClick = async (e: React.MouseEvent, item: SlotItem) => {
    e.stopPropagation();
    setIsLoadingHint(true);
    setHintData(null);

    const vocabItem = item.originalItem;

    try {
        let sentence = "";
        // Use Gemini to generate a dynamic sentence if API key exists
        if (process.env.API_KEY) {
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
             const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: `Generate a very simple German sentence (A2/B1 level) using the word "${vocabItem.german}".
                           The sentence is a hint for a student learning German.
                           Use simple vocabulary and clear context so the meaning is obvious.
                           Do not use the English word "${vocabItem.english}".
                           Do not translate the sentence.
                           Make sure the sentence is different from this existing example: "${vocabItem.example}".`,
                config: { thinkingConfig: { thinkingBudget: 0 } }
             });
             sentence = response.text || vocabItem.example;
        } else {
             // Fallback
             sentence = vocabItem.example;
        }

        setHintData({
            word: vocabItem.german,
            sentence: sentence
        });
    } catch (err) {
        console.error("Hint generation failed", err);
        setHintData({
            word: vocabItem.german,
            sentence: vocabItem.example // Fallback to static example
        });
    } finally {
        setIsLoadingHint(false);
    }
  };

  const closeHint = () => {
      setHintData(null);
  };

  // --- RENDER ---
  const renderSlot = (side: 'left' | 'right', index: number) => {
    const slots = side === 'left' ? leftSlots : rightSlots;
    const item = slots[index];
    const isSelected = side === 'left' ? selectedLeft === index : selectedRight === index;
    
    if (!item) {
      return (
        <div className="w-full h-16 md:h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
            <span className="text-gray-300 text-xs">...</span>
        </div>
      );
    }

    if (item.state === 'matched') {
       return <div className="w-full h-16 md:h-20 rounded-xl border-2 border-transparent bg-transparent"></div>;
    }

    let baseStyle = "w-full h-16 md:h-20 rounded-xl flex items-center justify-center p-3 text-center text-sm md:text-base font-medium transition-all shadow-sm border-2 cursor-pointer transform active:scale-95 duration-200 relative overflow-hidden group";
    let stateStyle = "bg-white border-gray-200 text-gray-700 hover:border-goethe-blue hover:bg-blue-50";

    if (isSelected || item.state === 'selected') {
      stateStyle = "bg-blue-100 border-goethe-blue text-goethe-blue ring-2 ring-blue-200 shadow-md scale-100";
    }
    
    if (item.state === 'wrong') {
      stateStyle = "bg-red-50 border-red-500 text-red-500 animate-shake";
    }

    // Check failures: >= 2 and MUST be German card
    const failCount = failures[item.vocabId] || 0;
    const showHintBtn = failCount >= 2 && item.type === 'german';

    return (
      <div 
        onClick={() => handleCardClick(side, index)}
        className={`${baseStyle} ${stateStyle}`}
      >
        {showHintBtn && (
            <button
                onClick={(e) => handleHintClick(e, item)}
                className="absolute top-1 left-1 p-1 bg-yellow-100 hover:bg-yellow-200 rounded-full text-yellow-600 transition-colors z-20 shadow-sm"
                title="Get a hint"
            >
                <LightBulbIcon className="w-4 h-4" />
            </button>
        )}
        <span className="z-10 relative select-none">{item.text}</span>
      </div>
    );
  };

  // --- MODALS ---
  const checkpointModal = showCheckpoint && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 transition-transform">
        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <SparklesIcon className="w-12 h-12 text-green-600 animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {matchesCount % 10 === 0 ? "Fantastisch!" : "Great Job!"}
        </h2>
        <p className="text-gray-600 mb-8">You've matched {matchesCount} pairs so far.</p>
        
        <button 
          onClick={() => { setShowCheckpoint(false); setIsPaused(false); }}
          className="w-full py-3 px-6 bg-goethe-blue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
        >
          <span>Continue</span>
          <PlayIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  const hintModal = (hintData || isLoadingHint) && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={closeHint}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
              <button onClick={closeHint} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-4 text-yellow-600">
                  <LightBulbIcon className="w-6 h-6" />
                  <h3 className="font-bold text-lg uppercase tracking-wide">Hint</h3>
              </div>

              {isLoadingHint ? (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                      <div className="w-8 h-8 border-4 border-goethe-blue border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p>Generating sentence...</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                      <div>
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Word</p>
                          <p className="text-xl font-bold text-gray-800">{hintData?.word}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                          <p className="text-lg text-gray-700 italic font-serif">"{hintData?.sentence}"</p>
                      </div>
                      <p className="text-xs text-center text-gray-400">Context cue provided by AI</p>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-2 relative min-h-[600px]">
      {checkpointModal}
      {hintModal}

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-20 z-10 gap-4">
        <div>
           <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Theme</span>
           <p className="font-semibold text-gray-700">{themeFilter}</p>
        </div>
        
        <div className="flex gap-12 items-center">
            <div className="text-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Streak</span>
                <div className="flex items-center justify-center gap-1">
                    <span className={`text-2xl font-bold ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{streak}</span>
                    <FireIcon className={`w-6 h-6 ${streak > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-300'}`} />
                </div>
            </div>
            <div className="text-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Matches</span>
                <span className="text-2xl font-bold text-goethe-blue">{matchesCount}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-12">
        <div className="space-y-4">
           {leftSlots.map((_, i) => (
             <React.Fragment key={`left-${i}`}>
               {renderSlot('left', i)}
             </React.Fragment>
           ))}
        </div>

        <div className="space-y-4">
           {rightSlots.map((_, i) => (
             <React.Fragment key={`right-${i}`}>
               {renderSlot('right', i)}
             </React.Fragment>
           ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button onClick={onComplete} className="text-gray-400 hover:text-gray-600 text-sm font-medium">
          Exit Game
        </button>
      </div>
    </div>
  );
};

export default MatchGame;
