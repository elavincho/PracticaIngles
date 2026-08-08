import React, { useState, useEffect } from 'react';
import { VocabularyWord } from '../../types';
import { Volume2, RotateCw, CheckCircle2, XCircle, Sparkles, VolumeX, Gauge, Play, Trophy, PartyPopper, Award } from 'lucide-react';
import { triggerLevelCelebration } from '../../utils/celebration';
import { recordWordFailure } from '../../utils/wordFailures';
import { motion } from 'motion/react';

interface FlashcardsProps {
  words: VocabularyWord[];
  onComplete: (earnedPoints: number, accuracy: number) => void;
  onProgressChange?: (inProgress: boolean) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ words, onComplete, onProgressChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Notify parent component about activity progress status
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(!completed);
    }
  }, [completed, onProgressChange]);

  // Audio Speech States
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.85x Normal, 0.5x Lento
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [englishVoice, setEnglishVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Load available native English voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB') ||
                          voices.find(v => v.lang.startsWith('en'));
        if (preferred) setEnglishVoice(preferred);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const playAudio = (text: string, e?: React.MouseEvent, overrideRate?: number) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.lang = englishVoice?.lang || 'en-US';
      utterance.rate = overrideRate || speechRate;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    
    // Auto-pronounce word when card changes if autoPlay is enabled
    if (autoPlay && words && words[currentIndex] && !completed) {
      const timer = setTimeout(() => {
        playAudio(words[currentIndex].word);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, words, autoPlay, completed]);

  if (!words || words.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No hay palabras disponibles para esta categoría o nivel.
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const handleKnow = (known: boolean) => {
    setIsFlipped(false);
    if (known) {
      setKnownCount(prev => prev + 1);
    } else if (currentWord && currentWord.word) {
      recordWordFailure(currentWord.word);
    }

    if (currentIndex + 1 < words.length) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150);
    } else {
      const finalKnown = known ? knownCount + 1 : knownCount;
      const accuracy = Math.round((finalKnown / words.length) * 100);
      const points = finalKnown * 15 + (accuracy >= 80 ? 50 : 10);
      
      triggerLevelCelebration();
      setCompleted(true);
      onComplete(points, accuracy);
    }
  };

  if (completed) {
    const accuracy = Math.round((knownCount / words.length) * 100);
    const xpEarned = (knownCount * 15) + (accuracy >= 80 ? 50 : 10);

    return (
      <motion.div 
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-w-lg mx-auto relative overflow-hidden"
      >
        {/* Background glow particle accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Floating Trophy Icon with Pulse Ring */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ delay: 0.1, duration: 0.6, type: 'spring' }}
          className="relative"
        >
          <div className="w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg border border-amber-500/30">
            <Trophy className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
            <Sparkles className="w-4 h-4 animate-spin" />
          </span>
        </motion.div>

        <div className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            ¡Nivel Completado con Éxito!
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
            ¡Sesión de Flashcards Superada!
          </h3>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm">
          Has dominado <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{knownCount}</span> de <span className="font-extrabold text-slate-900 dark:text-white">{words.length}</span> tarjetas con un <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{accuracy}%</span> de precisión.
        </p>

        {/* XP Badge */}
        <div className="flex items-center space-x-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl px-6 py-3 shadow-inner">
          <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div className="text-left">
            <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">Recompensa Obtenida</span>
            <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">+{xpEarned} XP de Experiencia</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => triggerLevelCelebration()}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-5 py-2.5 rounded-full text-xs transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <PartyPopper className="w-4 h-4" />
            <span>¡Lanzar Confeti!</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              setKnownCount(0);
              setCompleted(false);
            }}
            className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 rounded-full text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <RotateCw className="w-4 h-4" />
            <span>Repetir Práctica</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between h-full min-h-[440px] p-4 sm:p-6">
      {/* Top Bar: Progress and Audio Settings */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-slate-500 mb-2">
        <div className="flex items-center space-x-2">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            Tarjeta {currentIndex + 1} de {words.length}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Aprobadas: {knownCount}
          </span>
        </div>

        {/* Web Speech API Controls Bar */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full border border-slate-200 dark:border-slate-700">
          {/* Speed Selector */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-full p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSpeechRate(0.85)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all ${
                speechRate === 0.85
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Velocidad normal"
            >
              Normal 0.85x
            </button>
            <button
              type="button"
              onClick={() => setSpeechRate(0.5)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all flex items-center space-x-0.5 ${
                speechRate === 0.5
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Velocidad lenta para practicar fonética"
            >
              <span>🐢 Lento 0.5x</span>
            </button>
          </div>

          {/* Auto-play toggle */}
          <button
            type="button"
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 border transition-all ${
              autoPlay
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-transparent'
            }`}
            title="Activar/desactivar audio automático al cambiar de tarjeta"
          >
            {autoPlay ? <Volume2 className="w-3 h-3 text-emerald-500 animate-pulse" /> : <VolumeX className="w-3 h-3" />}
            <span>Auto-voz {autoPlay ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Interactive 3D Card Stage */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full max-w-sm h-72 sm:h-80 cursor-pointer perspective-1000 my-auto"
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT side */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-950/80 rounded-3xl shadow-lg p-5 flex flex-col items-center justify-between backface-hidden">
            <div className="w-full flex justify-between items-start">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                {currentWord.category}
              </span>
              
              {/* Voice button with speaking feedback animation */}
              <button
                type="button"
                onClick={(e) => playAudio(currentWord.word, e)}
                className={`p-2.5 rounded-full transition-all shadow-xs flex items-center justify-center ${
                  isSpeaking
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900 animate-bounce'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                }`}
                title="Escuchar pronunciación nativa"
              >
                <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            {/* Direct image display */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center my-1">
              {currentWord.imageUrl && !imageError ? (
                <img
                  src={currentWord.imageUrl}
                  alt={currentWord.word}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-slate-900 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex flex-col items-center justify-center p-2 text-center shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-sm mb-1">
                    {currentWord.word.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 truncate max-w-full">
                    {currentWord.category}
                  </span>
                </div>
              )}
            </div>

            <div className="text-center my-1">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center space-x-2">
                <span>{currentWord.word}</span>
              </h3>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                {currentWord.phonetic}
              </p>
            </div>

            <div className="flex items-center space-x-1 text-xs text-indigo-500 font-semibold animate-pulse">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Toca para ver la traducción</span>
            </div>
          </div>

          {/* BACK side */}
          <div className="absolute inset-0 w-full h-full bg-slate-900 text-white border-2 border-indigo-500/30 rounded-3xl shadow-xl p-6 flex flex-col items-center justify-between rotate-y-180 backface-hidden">
            <div className="w-full flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                Español
              </span>
              <button
                type="button"
                onClick={(e) => playAudio(currentWord.word, e)}
                className="p-2 rounded-full bg-slate-800 text-indigo-400 hover:bg-slate-700 transition-colors"
                title="Escuchar palabra"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center my-auto w-full">
              <h4 className="text-3xl font-extrabold text-white tracking-tight mb-3">
                {currentWord.translation}
              </h4>

              {/* Clickable Example Sentence Audio */}
              <div
                onClick={(e) => playAudio(currentWord.exampleSentenceEn, e)}
                className="bg-slate-800/90 hover:bg-slate-800 rounded-xl p-3 text-left space-y-1 text-xs border border-slate-700/80 cursor-pointer transition-all hover:border-indigo-500/50 group"
                title="Toca para escuchar la oración de ejemplo"
              >
                <div className="flex items-center justify-between">
                  <p className="text-indigo-300 font-semibold group-hover:text-indigo-200">
                    "{currentWord.exampleSentenceEn}"
                  </p>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400 opacity-70 group-hover:opacity-100 shrink-0 ml-1" />
                </div>
                <p className="text-slate-400 italic">"{currentWord.exampleSentenceEs}"</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Toca para voltear
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Know vs Don't know */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-4">
        <button
          type="button"
          onClick={() => handleKnow(false)}
          className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xs cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-red-500" />
          <span>Aún no la sé</span>
        </button>
        <button
          type="button"
          onClick={() => handleKnow(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>¡Ya me la sé!</span>
        </button>
      </div>
    </div>
  );
};

