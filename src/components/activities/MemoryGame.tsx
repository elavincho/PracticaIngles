import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../../types';
import { Sparkles, Brain, RotateCcw } from 'lucide-react';
import { triggerLevelCelebration } from '../../utils/celebration';

interface MemoryGameProps {
  words: VocabularyWord[];
  onComplete: (earnedPoints: number, accuracy: number, details?: { attempts?: number; moves?: number; correctSentences?: number; correctWords?: number; matchedWords?: number }) => void;
  onProgressChange?: (inProgress: boolean) => void;
}

interface Card {
  id: string;
  wordId: string;
  text: string;
  type: 'en' | 'es';
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIRS_PER_ROUND = 4;

export const MemoryGame: React.FC<MemoryGameProps> = ({ words, onComplete, onProgressChange }) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [totalMoves, setTotalMoves] = useState(0);
  const [totalMatchedPairs, setTotalMatchedPairs] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Notify parent component about activity progress status
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(!completed);
    }
  }, [completed, onProgressChange]);

  const totalRounds = Math.ceil((words?.length || 0) / PAIRS_PER_ROUND) || 1;

  const loadRound = (roundIndex: number, wordsList: VocabularyWord[]) => {
    if (!wordsList || wordsList.length === 0) return;
    const start = roundIndex * PAIRS_PER_ROUND;
    const selected = wordsList.slice(start, start + PAIRS_PER_ROUND);
    const deck: Card[] = [];

    selected.forEach((w, index) => {
      deck.push({
        id: `en_${roundIndex}_${index}_${w.word}`,
        wordId: w.word,
        text: w.word,
        type: 'en',
        isFlipped: false,
        isMatched: false
      });
      deck.push({
        id: `es_${roundIndex}_${index}_${w.word}`,
        wordId: w.word,
        text: w.translation,
        type: 'es',
        isFlipped: false,
        isMatched: false
      });
    });

    setCards(deck.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
  };

  useEffect(() => {
    if (words && words.length > 0) {
      setCurrentRound(0);
      setTotalMoves(0);
      setTotalMatchedPairs(0);
      setCompleted(false);
      loadRound(0, words);
    }
  }, [words]);

  const handleCardClick = (clickedCard: Card) => {
    if (clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length >= 2) return;

    const newCards = cards.map(c => (c.id === clickedCard.id ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setTotalMoves(prev => prev + 1);
      const [first, second] = newFlipped;

      if (first.wordId === second.wordId) {
        // Match found
        setTimeout(() => {
          const updatedCards = cards.map(c =>
            c.wordId === first.wordId ? { ...c, isMatched: true, isFlipped: true } : c
          );
          setCards(updatedCards);
          setFlippedCards([]);
          const newTotalPairs = totalMatchedPairs + 1;
          setTotalMatchedPairs(newTotalPairs);

          // Check if current round cards are all matched
          const remainingInRound = updatedCards.filter(c => !c.isMatched);
          if (remainingInRound.length === 0) {
            if (currentRound + 1 < totalRounds) {
              // Advance to next round
              setTimeout(() => {
                const nextRoundIndex = currentRound + 1;
                setCurrentRound(nextRoundIndex);
                loadRound(nextRoundIndex, words);
              }, 400);
            } else {
              // All 20+ words matched!
              const finalMoves = totalMoves + 1;
              const accuracy = 90;
              const points = words.length * 15 + 50;
              triggerLevelCelebration();
              setCompleted(true);
              onComplete(points, accuracy, { moves: finalMoves, matchedWords: words.length });
            }
          }
        }, 400);
      } else {
        // No match: flip back
        setTimeout(() => {
          setCards(prev =>
            prev.map(c => (c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  const restartAll = () => {
    setCurrentRound(0);
    setTotalMoves(0);
    setTotalMatchedPairs(0);
    setCompleted(false);
    loadRound(0, words);
  };

  if (completed) {
    const earnedPoints = words.length * 15 + 50;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
          <Brain className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">¡Memoria Completa Superada!</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Encontraste las <span className="font-bold text-emerald-600">{words.length}</span> parejas de palabras en <span className="font-bold text-indigo-600">{totalMoves}</span> movimientos.
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-6 py-3 font-bold text-indigo-700 dark:text-indigo-300">
          +{earnedPoints} XP Ganados
        </div>
        <button
          onClick={restartAll}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full text-sm transition-all shadow-md active:scale-95"
        >
          Jugar de Nuevo ({words.length} palabras)
        </button>
      </div>
    );
  }

  const startWordIdx = currentRound * PAIRS_PER_ROUND + 1;
  const endWordIdx = Math.min((currentRound + 1) * PAIRS_PER_ROUND, words.length);

  return (
    <div className="flex flex-col justify-between h-full p-4 sm:p-6 space-y-4">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
            <span>Juego de Memoria</span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
              {words.length} palabras totales
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ronda {currentRound + 1} de {totalRounds} (Palabras {startWordIdx} a {endWordIdx})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            {totalMatchedPairs} / {words.length} parejas
          </span>
          <button
            onClick={restartAll}
            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 text-slate-600 dark:text-slate-300"
            title="Reiniciar Repaso"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 my-auto">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card)}
            disabled={card.isMatched || card.isFlipped}
            className={`h-24 sm:h-28 rounded-2xl p-2 font-bold text-xs sm:text-sm flex flex-col items-center justify-center border transition-all duration-300 ${
              card.isMatched
                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 opacity-50 scale-95'
                : card.isFlipped
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-400'
            }`}
          >
            {card.isFlipped || card.isMatched ? (
              <span className="text-center leading-tight">{card.text}</span>
            ) : (
              <Brain className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Movimientos acumulados: {totalMoves}</span>
        <span>Progreso de categoría: {Math.round((totalMatchedPairs / words.length) * 100)}%</span>
      </div>
    </div>
  );
};
