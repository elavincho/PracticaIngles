import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../../types';
import { Sparkles, Check, ChevronRight, Trophy, PartyPopper } from 'lucide-react';
import { triggerLevelCelebration } from '../../utils/celebration';

interface DragAndDropProps {
  words: VocabularyWord[];
  onComplete: (earnedPoints: number, accuracy: number, details?: { attempts?: number; moves?: number; correctSentences?: number; correctWords?: number; matchedWords?: number }) => void;
  onProgressChange?: (inProgress: boolean) => void;
}

const BATCH_SIZE = 5;

export const DragAndDrop: React.FC<DragAndDropProps> = ({ words, onComplete, onProgressChange }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // word -> translation
  const [shuffledTranslations, setShuffledTranslations] = useState<string[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<VocabularyWord[]>([]);
  const [totalMatchedCount, setTotalMatchedCount] = useState(0);

  // Notify parent component about activity progress status
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(!completed);
    }
  }, [completed, onProgressChange]);

  const totalRounds = Math.ceil((words?.length || 0) / BATCH_SIZE) || 1;

  const loadRound = (roundIndex: number, wordsList: VocabularyWord[]) => {
    if (!wordsList || wordsList.length === 0) return;
    const start = roundIndex * BATCH_SIZE;
    const batch = wordsList.slice(start, start + BATCH_SIZE);
    setCurrentBatch(batch);
    const translations = batch.map(w => w.translation);
    setShuffledTranslations([...translations].sort(() => Math.random() - 0.5));
    setMatches({});
    setSelectedWord(null);
  };

  useEffect(() => {
    if (words && words.length > 0) {
      setCurrentRound(0);
      setTotalAttempts(0);
      setTotalMatchedCount(0);
      setCompleted(false);
      loadRound(0, words);
    }
  }, [words]);

  const handleSelectWord = (word: string) => {
    if (matches[word]) return; // already matched
    setSelectedWord(word);
  };

  const handleSelectTranslation = (translation: string) => {
    if (!selectedWord) return;
    setTotalAttempts(prev => prev + 1);

    const target = currentBatch.find(w => w.word === selectedWord);
    if (target && target.translation === translation) {
      const newMatches = { ...matches, [selectedWord]: translation };
      setMatches(newMatches);
      setSelectedWord(null);
      const newTotalMatched = totalMatchedCount + 1;
      setTotalMatchedCount(newTotalMatched);

      // Check if current batch round is completed
      if (Object.keys(newMatches).length === currentBatch.length) {
        if (currentRound + 1 < totalRounds) {
          // Move to next round
          setTimeout(() => {
            const nextRoundIndex = currentRound + 1;
            setCurrentRound(nextRoundIndex);
            loadRound(nextRoundIndex, words);
          }, 400);
        } else {
          // All 20+ words completed!
          const finalAttempts = totalAttempts + 1;
          const accuracy = Math.round((words.length / Math.max(words.length, finalAttempts)) * 100);
          const points = words.length * 15 + (accuracy >= 80 ? 50 : 10);
          triggerLevelCelebration();
          setCompleted(true);
          onComplete(points, accuracy, { attempts: finalAttempts, matchedWords: words.length });
        }
      }
    } else {
      // Wrong match feedback
      setSelectedWord(null);
    }
  };

  if (completed) {
    const accuracy = Math.round((words.length / Math.max(words.length, totalAttempts)) * 100);
    const earnedPoints = words.length * 15 + (accuracy >= 80 ? 50 : 10);

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">¡Repaso Completo Concluido!</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Emparejaste exitosamente las <span className="font-bold text-emerald-600">{words.length}</span> palabras del tema en <span className="font-bold text-indigo-600">{totalAttempts}</span> intentos.
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-6 py-3 font-bold text-indigo-700 dark:text-indigo-300">
          +{earnedPoints} XP Ganados
        </div>
        <button
          onClick={() => {
            setCurrentRound(0);
            setTotalAttempts(0);
            setTotalMatchedCount(0);
            setCompleted(false);
            loadRound(0, words);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-md active:scale-95"
        >
          Repetir Todas las {words.length} Palabras
        </button>
      </div>
    );
  }

  const startWordIdx = currentRound * BATCH_SIZE + 1;
  const endWordIdx = Math.min((currentRound + 1) * BATCH_SIZE, words.length);

  return (
    <div className="flex flex-col justify-between h-full p-4 sm:p-6 space-y-4">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <span>Toca para Emparejar</span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
              {words.length} palabras totales
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ronda {currentRound + 1} de {totalRounds} (Palabras {startWordIdx} a {endWordIdx})
          </p>
        </div>
        <div className="text-right flex items-center space-x-2">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            {totalMatchedCount} / {words.length} parejas
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-auto">
        {/* Left Column: English words */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-1">
            Inglés
          </span>
          {currentBatch.map(item => {
            const isMatched = !!matches[item.word];
            const isSelected = selectedWord === item.word;
            return (
              <button
                key={item.word}
                onClick={() => handleSelectWord(item.word)}
                disabled={isMatched}
                className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-bold text-left flex items-center justify-between border transition-all ${
                  isMatched
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-800 opacity-60'
                    : isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 scale-102'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <span className="truncate">{item.word}</span>
                {isMatched && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Right Column: Spanish translations */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-1">
            Español
          </span>
          {shuffledTranslations.map(trans => {
            const isMatched = Object.values(matches).includes(trans);
            return (
              <button
                key={trans}
                onClick={() => handleSelectTranslation(trans)}
                disabled={isMatched}
                className={`w-full p-3 rounded-2xl text-xs sm:text-sm font-bold text-left flex items-center justify-between border transition-all ${
                  isMatched
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-800 opacity-60'
                    : selectedWord
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-slate-800 dark:text-white border-indigo-300 dark:border-indigo-700 hover:bg-indigo-600 hover:text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="truncate">{trans}</span>
                {isMatched && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Intentos acumulados: {totalAttempts}</span>
        <div className="flex items-center space-x-1">
          <span>Progreso: {Math.round((totalMatchedCount / words.length) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
