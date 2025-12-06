
import React, { useState, useEffect } from 'react';
import { VOCAB_DATA } from './constants';
import { Theme, UserProgress } from './types';
import { getProgress } from './utils/storage';
import Dashboard from './components/Dashboard';
import FlashcardGame from './components/FlashcardGame';
import MatchGame from './components/MatchGame';
import { AcademicCapIcon } from '@heroicons/react/24/solid';

type ViewMode = 'dashboard' | 'flashcards' | 'match';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [selectedTheme, setSelectedTheme] = useState<Theme | 'All'>('All');
  const [progress, setProgress] = useState<UserProgress>({});

  useEffect(() => {
    // Load progress on mount and whenever returning to dashboard
    if (view === 'dashboard') {
      setProgress(getProgress());
    }
  }, [view]);

  const handleStartGame = (mode: 'flashcards' | 'match', theme: Theme | 'All') => {
    setSelectedTheme(theme);
    setView(mode);
  };

  const handleBackToDash = () => {
    setView('dashboard');
  };

  // Logic to determine which data to show
  const getActiveData = () => {
    if (selectedTheme === 'All') {
      // Return everything EXCEPT A2 (B1 and B2 only) for mixed practice
      return VOCAB_DATA.filter(item => item.level !== 'A2');
    } else {
      // Specific theme (A2, B1, or B2)
      return VOCAB_DATA.filter(item => item.theme === selectedTheme);
    }
  };

  const activeData = getActiveData();
  const gameThemeProp = selectedTheme; 

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
            onClick={handleBackToDash}
          >
            <div className="bg-gradient-to-br from-goethe-blue to-purple-600 p-2 rounded-lg shadow-sm">
                <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Vocab<span className="text-goethe-blue">Master</span></h1>
          </div>

          {view !== 'dashboard' && (
             <button 
               onClick={handleBackToDash}
               className="text-sm font-medium text-gray-500 hover:text-goethe-blue transition flex items-center gap-1"
             >
               <span className="hidden sm:inline">Back to Dashboard</span>
               <span className="sm:hidden">Exit</span>
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && (
          <Dashboard onStartGame={handleStartGame} progress={progress} />
        )}

        {view === 'flashcards' && (
          <div className="animate-fade-in-up">
            <FlashcardGame 
                data={activeData} 
                themeFilter={gameThemeProp} 
                onComplete={handleBackToDash} 
            />
          </div>
        )}

        {view === 'match' && (
          <div className="animate-fade-in-up">
            <MatchGame 
                data={activeData} 
                themeFilter={gameThemeProp} 
                onComplete={handleBackToDash} 
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 text-center text-sm text-gray-500">
          <p>Comprehensive vocabulary training for A2, B1, and B2 levels.</p>
          <p className="mt-2 text-xs text-gray-400">Created by Hirusha & Vihanga</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
