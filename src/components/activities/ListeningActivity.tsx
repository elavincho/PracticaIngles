import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../../types';
import { Volume2, Sparkles, CheckCircle2, XCircle, Ear } from 'lucide-react';
import { triggerLevelCelebration } from '../../utils/celebration';
import { recordWordFailure } from '../../utils/wordFailures';

interface ListeningActivityProps {
  words: VocabularyWord[];
  onComplete: (earnedPoints: number, accuracy: number, details?: { attempts?: number; moves?: number; correctSentences?: number; correctWords?: number; matchedWords?: number }) => void;
  onProgressChange?: (inProgress: boolean) => void;
}

export const ListeningActivity: React.FC<ListeningActivityProps> = ({ words, onComplete, onProgressChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Notify parent component about activity progress status
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(!completed);
    }
  }, [completed, onProgressChange]);

  if (!words || words.length === 0) return null;

  const currentWord = words[currentIndex];

  const playVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentWord) {
      playVoice();
      // Generate 4 multiple-choice options in Spanish
      const correct = currentWord.translation;
      const others = words
        .filter(w => w.word !== currentWord.word)
        .map(w => w.translation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      setOptions([correct, ...others].sort(() => Math.random() - 0.5));
      setSelectedOption(null);
      setFeedback(null);
    }
  }, [currentIndex, words]);

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);

    const isCorrect = option === currentWord.translation;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setScore(prev => prev + 1);
    } else if (currentWord && currentWord.word) {
      recordWordFailure(currentWord.word);
    }

    setTimeout(() => {
      if (currentIndex + 1 < words.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const finalScore = isCorrect ? score + 1 : score;
        const accuracy = Math.round((finalScore / words.length) * 100);
        triggerLevelCelebration();
        setCompleted(true);
        onComplete(finalScore * 25, accuracy, { correctWords: finalScore });
      }
    }, 1200);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
          <Ear className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">¡Oído de Halcón!</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Reconociste auditivamente <span className="font-bold text-emerald-600">{score}</span> de <span className="font-bold">{words.length}</span> palabras.
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-6 py-3 font-bold text-indigo-700 dark:text-indigo-300">
          +{score * 25} XP Ganados
        </div>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setCompleted(false);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-md active:scale-95"
        >
          Repetir Listening
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
        <span>Audio {currentIndex + 1} de {words.length}</span>
        <span className="text-indigo-600 dark:text-indigo-400">Escucha y selecciona la traducción</span>
      </div>

      <div className="my-auto flex flex-col items-center space-y-4">
        {/* Big Audio Trigger Button */}
        <button
          onClick={playVoice}
          className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
        >
          <Volume2 className="w-10 h-10 group-hover:animate-pulse" />
        </button>
        <span className="text-xs text-slate-400 font-medium">Presiona para volver a escuchar</span>

        {/* Options Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isTarget = option === currentWord.translation;

            let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:border-indigo-500';
            if (selectedOption !== null) {
              if (isTarget) {
                btnStyle = 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-102';
              } else if (isSelected && !isTarget) {
                btnStyle = 'bg-red-500 text-white border-red-500 shadow-md';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(option)}
                disabled={selectedOption !== null}
                className={`p-4 rounded-2xl border text-sm font-bold transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{option}</span>
                {selectedOption !== null && isTarget && <CheckCircle2 className="w-4 h-4 text-white" />}
                {selectedOption !== null && isSelected && !isTarget && <XCircle className="w-4 h-4 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
