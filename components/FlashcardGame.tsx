
import React, { useState, useEffect, useCallback } from 'react';
import { VocabItem, Theme } from '../types';
import { updateWordProgress, getSRSPriorityQueue } from '../utils/storage';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Props {
  data: VocabItem[];
  themeFilter: Theme | 'All';
  onComplete: () => void;
}

const FlashcardGame: React.FC<Props> = ({ data, themeFilter, onComplete }) => {
  const [queue, setQueue] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const filtered = themeFilter === 'All' 
      ? data 
      : data.filter(item => item.theme === themeFilter);
    
    // Use the SRS priority queue to sort cards
    // Due cards -> New cards -> Future cards
    const srsQueue = getSRSPriorityQueue(filtered);
    
    setQueue(srsQueue);
    setCurrentIndex(0);
    setFinished(false);
    setIsFlipped(false);
  }, [data, themeFilter]);

  const handleRate = (rating: 'fail' | 'hard' | 'good' | 'easy') => {
    if (queue.length === 0) return;
    
    const currentCard = queue[currentIndex];
    updateWordProgress(currentCard.id, rating);

    if (currentIndex < queue.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setFinished(true);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">No cards found!</h2>
        <p className="text-gray-500">Try selecting a different category.</p>
        <button onClick={onComplete} className="mt-6 px-6 py-2 bg-goethe-blue text-white rounded-lg hover:bg-opacity-90 transition">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="text-center p-10 bg-white rounded-xl shadow-lg animate-fade-in">
        <div className="flex justify-center mb-4">
          <CheckCircleIcon className="w-16 h-16 text-goethe-accent" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Complete!</h2>
        <p className="text-gray-600 mb-6">You've reviewed {queue.length} words.</p>
        <button 
          onClick={onComplete}
          className="px-8 py-3 bg-goethe-blue text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition transform hover:scale-105"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentCard = queue[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between items-center text-sm text-gray-500 font-medium">
        <span>{themeFilter} Priority Queue</span>
        <span>{currentIndex + 1} / {queue.length}</span>
      </div>

      {/* Card Container */}
      <div 
        className="relative h-96 w-full cursor-pointer perspective-1000 group"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border-b-4 border-goethe-blue flex flex-col items-center justify-center p-8 backface-hidden">
            <span className="text-sm uppercase tracking-widest text-gray-400 mb-4">{currentCard.type}</span>
            <h2 className="text-4xl font-bold text-gray-800 text-center">
              {currentCard.type === 'noun' && currentCard.article && (
                <span className={`mr-2 ${currentCard.article === 'der' ? 'text-blue-500' : currentCard.article === 'die' ? 'text-red-500' : 'text-green-600'}`}>
                  {currentCard.article}
                </span>
              )}
              {currentCard.german}
            </h2>
             {currentCard.type === 'verb' && currentCard.preposition && (
                 <p className="mt-4 text-xl text-goethe-blue font-medium">
                   {currentCard.preposition} <span className="text-gray-400 text-sm">({currentCard.case})</span>
                 </p>
             )}
             {currentCard.type === 'noun' && currentCard.plural && (
                <p className="mt-2 text-gray-400 text-sm">pl: {currentCard.plural}</p>
             )}
             <p className="absolute bottom-8 text-gray-400 text-sm animate-pulse">Click to reveal</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full bg-slate-50 rounded-2xl shadow-xl border-b-4 border-goethe-accent rotate-y-180 backface-hidden flex flex-col items-center justify-center p-8">
             <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">{currentCard.english}</h3>
             
             <div className="w-full h-px bg-gray-200 my-4"></div>
             
             <div className="text-center">
               <p className="text-gray-600 italic mb-2">"{currentCard.example}"</p>
               {currentCard.synonyms && (
                 <p className="text-sm text-gray-500 mt-4">
                   <span className="font-bold">Synonyms:</span> {currentCard.synonyms}
                 </p>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {isFlipped ? (
        <div className="mt-8 grid grid-cols-4 gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); handleRate('fail'); }}
            className="flex flex-col items-center p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
          >
            <span className="font-bold text-lg">Again</span>
            <span className="text-xs opacity-75">Today</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRate('hard'); }}
            className="flex flex-col items-center p-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
          >
            <span className="font-bold text-lg">Hard</span>
            <span className="text-xs opacity-75">1d</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRate('good'); }}
            className="flex flex-col items-center p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
          >
            <span className="font-bold text-lg">Good</span>
            <span className="text-xs opacity-75">3d</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRate('easy'); }}
            className="flex flex-col items-center p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
          >
            <span className="font-bold text-lg">Easy</span>
            <span className="text-xs opacity-75">7d</span>
          </button>
        </div>
      ) : (
        <div className="h-24"></div> // Spacer to prevent layout jump
      )}
    </div>
  );
};

export default FlashcardGame;
