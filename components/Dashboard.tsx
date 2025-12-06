
import React from 'react';
import { Theme, UserProgress, StudySession } from '../types';
import { BookOpenIcon, PuzzlePieceIcon, ChartBarIcon, StarIcon, TrophyIcon, FireIcon, ClockIcon } from '@heroicons/react/24/outline';
import { VOCAB_DATA } from '../constants';

interface Props {
  onStartGame: (mode: 'flashcards' | 'match', theme: Theme | 'All') => void;
  progress: UserProgress;
}

const Dashboard: React.FC<Props> = ({ onStartGame, progress }) => {
  // Calculate simple stats
  const totalWords = VOCAB_DATA.length;
  const sessions = Object.values(progress) as StudySession[];
  const learnedWords = sessions.filter(p => p.box > 0).length;
  const masteredWords = sessions.filter(p => p.box >= 4).length;

  const now = Date.now();

  const getLevelStats = (theme: Theme) => {
    const items = VOCAB_DATA.filter(i => i.theme === theme);
    const total = items.length;
    let mastered = 0;
    let due = 0;
    
    items.forEach(item => {
        const p = progress[item.id];
        if (p) {
            if (p.box >= 4) mastered++;
            if (p.nextReview <= now && p.box > 0) due++; // Only count as "due" if we've actually started learning it
        }
    });
    
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, percentage, due };
  };

  const a2Stats = getLevelStats(Theme.A2);
  const b1Stats = getLevelStats(Theme.B1);
  const b2Stats = getLevelStats(Theme.B2);
  const totalDue = a2Stats.due + b1Stats.due + b2Stats.due;

  return (
    <div className="space-y-10">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-goethe-blue rounded-full">
            <BookOpenIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Vocabulary</p>
            <p className="text-2xl font-bold text-gray-800">{totalWords}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-teal-100 text-teal-700 rounded-full">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-gray-800">{learnedWords}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <PuzzlePieceIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mastered</p>
            <p className="text-2xl font-bold text-gray-800">{masteredWords}</p>
          </div>
        </div>
      </div>

      {/* Daily Review Section */}
      <div className={`rounded-xl border p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm ${totalDue > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${totalDue > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                <ClockIcon className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">
                    {totalDue > 0 ? "Daily Review Ready" : "All Caught Up!"}
                </h2>
                <p className="text-gray-600 mt-1">
                    {totalDue > 0 
                        ? `You have ${totalDue} words pending review based on your learning curve.` 
                        : "Great job! You have no words due for review right now."}
                </p>
                {totalDue > 0 && (
                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                        {a2Stats.due > 0 && <span><span className="font-bold text-orange-600">{a2Stats.due}</span> A2</span>}
                        {b1Stats.due > 0 && <span><span className="font-bold text-orange-600">{b1Stats.due}</span> B1</span>}
                        {b2Stats.due > 0 && <span><span className="font-bold text-orange-600">{b2Stats.due}</span> B2</span>}
                    </div>
                )}
            </div>
        </div>
        
        {totalDue > 0 && (
            <button 
                onClick={() => onStartGame('flashcards', 'All')}
                className="whitespace-nowrap px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105 flex items-center gap-2"
            >
                <BookOpenIcon className="w-5 h-5" /> Review Now
            </button>
        )}
      </div>

      {/* Global Mixed Practice */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg text-white p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2">Mixed Practice</h2>
            <p className="text-indigo-100 text-lg">Master intermediate and advanced vocabulary (B1 & B2) in one session.</p>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={() => onStartGame('flashcards', 'All')}
                className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition transform hover:scale-105 flex items-center gap-2"
              >
                <BookOpenIcon className="w-5 h-5" /> Study All
              </button>
              <button 
                onClick={() => onStartGame('match', 'All')}
                className="px-6 py-3 bg-indigo-500 bg-opacity-30 backdrop-blur-md border border-indigo-400 text-white font-bold rounded-xl shadow-lg hover:bg-opacity-40 transition transform hover:scale-105 flex items-center gap-2"
              >
                <PuzzlePieceIcon className="w-5 h-5" /> Match All
              </button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* A2 Column */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <div className="p-1 bg-green-100 rounded text-green-600">
                  <StarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Level A2</h2>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-green-400 transition-colors p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-800 text-lg">A2 Wortschatz</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Basic</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{a2Stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${a2Stats.percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-400">{a2Stats.mastered} / {a2Stats.total} mastered</p>
                        {a2Stats.due > 0 && <p className="text-xs text-orange-500 font-bold">{a2Stats.due} due</p>}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-6 line-clamp-2">Fundamental vocabulary for daily communication and basic needs.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button onClick={() => onStartGame('flashcards', Theme.A2)} className="flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg font-medium transition text-sm relative">
                    <BookOpenIcon className="w-4 h-4 mr-1 inline" /> Study
                    {a2Stats.due > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">{a2Stats.due}</span>}
                  </button>
                  <button onClick={() => onStartGame('match', Theme.A2)} className="flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg font-medium transition text-sm"><PuzzlePieceIcon className="w-4 h-4 mr-1 inline" /> Match</button>
                </div>
            </div>
        </div>

        {/* B1 Column */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <div className="p-1 bg-amber-100 rounded text-amber-600">
                  <FireIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Level B1</h2>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-amber-400 transition-colors p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-800 text-lg">B1 Wortschatz</h3>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">Intermediate</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{b1Stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${b1Stats.percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-400">{b1Stats.mastered} / {b1Stats.total} mastered</p>
                        {b1Stats.due > 0 && <p className="text-xs text-orange-500 font-bold">{b1Stats.due} due</p>}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-6 line-clamp-2">Intermediate vocabulary for work, school, and leisure.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button onClick={() => onStartGame('flashcards', Theme.B1)} className="flex items-center justify-center px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-medium transition text-sm relative">
                    <BookOpenIcon className="w-4 h-4 mr-1 inline" /> Study
                    {b1Stats.due > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">{b1Stats.due}</span>}
                  </button>
                  <button onClick={() => onStartGame('match', Theme.B1)} className="flex items-center justify-center px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-medium transition text-sm"><PuzzlePieceIcon className="w-4 h-4 mr-1 inline" /> Match</button>
                </div>
            </div>
        </div>

        {/* B2 Column */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <div className="p-1 bg-goethe-light rounded text-goethe-blue">
                  <TrophyIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Level B2</h2>
           </div>
           
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-goethe-blue transition-colors p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-800 text-lg">B2 Wortschatz</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Advanced</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{b2Stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-goethe-blue h-2 rounded-full transition-all duration-500" style={{ width: `${b2Stats.percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-400">{b2Stats.mastered} / {b2Stats.total} mastered</p>
                        {b2Stats.due > 0 && <p className="text-xs text-orange-500 font-bold">{b2Stats.due} due</p>}
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-6 line-clamp-2">Advanced vocabulary for complex topics and abstract thinking.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button onClick={() => onStartGame('flashcards', Theme.B2)} className="flex items-center justify-center px-4 py-2 border border-goethe-blue text-goethe-blue hover:bg-blue-50 rounded-lg font-medium transition text-sm relative">
                    <BookOpenIcon className="w-4 h-4 mr-1 inline" /> Study
                    {b2Stats.due > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">{b2Stats.due}</span>}
                  </button>
                  <button onClick={() => onStartGame('match', Theme.B2)} className="flex items-center justify-center px-4 py-2 border border-goethe-blue text-goethe-blue hover:bg-blue-50 rounded-lg font-medium transition text-sm"><PuzzlePieceIcon className="w-4 h-4 mr-1 inline" /> Match</button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
