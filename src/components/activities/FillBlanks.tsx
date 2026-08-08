import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../../types';
import { Sparkles, CheckCircle2, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { triggerLevelCelebration } from '../../utils/celebration';

interface FillBlanksProps {
  words: VocabularyWord[];
  onComplete: (earnedPoints: number, accuracy: number, details?: { attempts?: number; moves?: number; correctSentences?: number; correctWords?: number; matchedWords?: number }) => void;
  onProgressChange?: (inProgress: boolean) => void;
}

export const FillBlanks: React.FC<FillBlanksProps> = ({ words, onComplete, onProgressChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Notify parent component about activity progress status
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(!completed);
    }
  }, [completed, onProgressChange]);

  if (!words || words.length === 0) return null;

  const currentWord = words[currentIndex];

  // Mask letter(s) in the sentence or word
  const sentence = currentWord.exampleSentenceEn || `The word is ${currentWord.word}.`;
  const regex = new RegExp(currentWord.word, 'gi');
  const maskedSentence = sentence.replace(regex, '_______');
  const fullSentence = sentence.replace(regex, currentWord.word);

  const handleNext = (isRight: boolean, currentScore: number) => {
    setUserInput('');
    setFeedback(null);
    setShowHint(false);

    if (currentIndex + 1 < words.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const accuracy = Math.round((currentScore / words.length) * 100);
      triggerLevelCelebration();
      setCompleted(true);
      onComplete(currentScore * 20, accuracy, { correctSentences: currentScore });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || feedback !== null) return;

    const isRight = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    const newScore = isRight ? score + 1 : score;

    setFeedback(isRight ? 'correct' : 'incorrect');

    if (isRight) {
      setScore(newScore);
      setTimeout(() => {
        handleNext(true, newScore);
      }, 1200);
    }
    // For incorrect answers, we do NOT auto-advance; the user clicks "Entendido, siguiente frase"
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">¡Reto de Completar Superado!</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Respondiste correctamente <span className="font-bold text-emerald-600">{score}</span> de <span className="font-bold">{words.length}</span> frases.
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-6 py-3 font-bold text-indigo-700 dark:text-indigo-300">
          +{score * 20} XP Ganados
        </div>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setCompleted(false);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-md active:scale-95"
        >
          Nueva Práctica
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full p-4 sm:p-6">
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-2">
        <span>Frase {currentIndex + 1} de {words.length}</span>
        <span className="text-indigo-600 dark:text-indigo-400">Puntos: {score * 20}</span>
      </div>

      <div className="my-auto space-y-5">
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-center shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
            Traducción: "{currentWord.translation}"
          </span>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed mt-2">
            "{maskedSentence}"
          </p>
          {showHint && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-3">
              💡 Pista: Empieza por "{currentWord.word.substring(0, 2)}" ({currentWord.word.length} letras)
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              autoFocus
              disabled={feedback !== null}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Escribe la palabra en inglés..."
              className={`w-full p-4 rounded-2xl border text-center font-extrabold text-lg outline-none transition-all ${
                feedback === 'correct'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-4 ring-emerald-200'
                  : feedback === 'incorrect'
                  ? 'bg-red-50 text-red-700 border-red-500 ring-4 ring-red-200'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500'
              }`}
            />
            {feedback === 'correct' && (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 absolute right-4 top-4" />
            )}
            {feedback === 'incorrect' && (
              <XCircle className="w-6 h-6 text-red-500 absolute right-4 top-4" />
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              disabled={feedback !== null}
              onClick={() => setShowHint(true)}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center space-x-1 disabled:opacity-50"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Ver pista</span>
            </button>
            <button
              type="submit"
              disabled={feedback !== null}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <span>Comprobar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {feedback === 'correct' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 flex items-center justify-between text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold shadow-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>¡Respuesta correcta! (+20 XP)</span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">Avanzando...</span>
          </div>
        )}

        {feedback === 'incorrect' && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-200 dark:border-rose-900/80 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>¡Respuesta incorrecta! Repasa para aprender:</span>
            </div>

            <div className="bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs sm:text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Palabra correcta:</span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-base uppercase tracking-wider px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 rounded-lg">
                  {currentWord.word}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Traducción:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentWord.translation}</span>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-1.5 text-slate-700 dark:text-slate-300 italic text-xs">
                <span className="font-semibold text-slate-500 not-italic">Frase completa: </span>
                "{fullSentence}"
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleNext(false, score)}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
            >
              <span>Entendido, continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
