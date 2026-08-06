import React, { useState, useEffect, useRef } from 'react';
import { User, VocabularyWord, ActivityType, CategoryInfo } from '../types';
import { api } from '../services/api';
import { Flashcards } from './activities/Flashcards';
import { DragAndDrop } from './activities/DragAndDrop';
import { MemoryGame } from './activities/MemoryGame';
import { FillBlanks } from './activities/FillBlanks';
import { ListeningActivity } from './activities/ListeningActivity';
import {
  BookOpen,
  Sparkles,
  Flame,
  Award,
  Layers,
  CheckCircle2,
  Lock,
  Brain,
  Puzzle,
  PenTool,
  Ear,
  Target,
  Trophy,
  Search,
  ChevronRight,
  ArrowRight,
  Check,
  X
} from 'lucide-react';

interface BentoDashboardProps {
  user: User | null;
  onUpdateUser?: (updated: User) => void;
  onRequireAuth: () => void;
}

export const BentoDashboard: React.FC<BentoDashboardProps> = ({ user, onUpdateUser, onRequireAuth }) => {
  const [activeLevel, setActiveLevel] = useState<number>(user?.unlockedLevel || 1);
  const [activeCategory, setActiveCategory] = useState<string>('Saludos y presentaciones');
  const [activeActivity, setActiveActivity] = useState<ActivityType>('flashcards');
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [completedCategories, setCompletedCategories] = useState<string[]>(user?.completedCategories || []);
  // Leaderboards for each activity category
  const [globalLb, setGlobalLb] = useState<Array<any>>([]);
  const [dragdropLb, setDragdropLb] = useState<Array<any>>([]);
  const [memoryLb, setMemoryLb] = useState<Array<any>>([]);
  const [fillblanksLb, setFillblanksLb] = useState<Array<any>>([]);
  const [listeningLb, setListeningLb] = useState<Array<any>>([]);
  const [rankingLevel, setRankingLevel] = useState<number>(1);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isUserInitialized = useRef(false);

  // Suggestion Modal state
  const [suggestionModal, setSuggestionModal] = useState<{
    isOpen: boolean;
    type: 'category' | 'level';
    currentCategory?: string;
    nextCategory?: string;
    nextCategoryWords?: number;
    completedLevel?: number;
    nextLevel?: number;
  } | null>(null);

  // Daily target state
  const [dailyTarget] = useState<number>(20);
  const todayCompletedCount = user?.todayWordsCount || 0;

  // Synchronize unlocked level on initial load & update completed categories
  useEffect(() => {
    if (user && !isUserInitialized.current) {
      if (user.unlockedLevel) {
        setActiveLevel(user.unlockedLevel);
        setRankingLevel(user.unlockedLevel);
      }
      isUserInitialized.current = true;
    }
    if (user?.completedCategories) {
      setCompletedCategories(user.completedCategories);
    }
  }, [user]);

  // Load Leaderboards for all 5 Activity Categories
  const loadLeaderboards = async (level = rankingLevel) => {
    setLoadingLeaderboard(true);
    try {
      const [g, d, m, f, l] = await Promise.all([
        api.getLeaderboard('global', level),
        api.getLeaderboard('dragdrop', level),
        api.getLeaderboard('memory', level),
        api.getLeaderboard('fillblanks', level),
        api.getLeaderboard('listening', level)
      ]);
      setGlobalLb(g);
      setDragdropLb(d);
      setMemoryLb(m);
      setFillblanksLb(f);
      setListeningLb(l);
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    loadLeaderboards(rankingLevel);
  }, [rankingLevel, user?.points]);

  // Load vocabulary & categories from backend API
  const loadData = async () => {
    setLoading(true);
    try {
      const [words, cats] = await Promise.all([
        api.getVocabulary(activeLevel, activeCategory || undefined, searchQuery || undefined),
        api.getCategories()
      ]);
      setVocabulary(words);
      setCategories(cats);

      // Auto-select first category for current level if current activeCategory is not in current level
      const levelCats = cats.filter(c => c.level === activeLevel);
      if (levelCats.length > 0) {
        const isCurrentInLevel = levelCats.some(c => c.name === activeCategory);
        if (!isCurrentInLevel && !searchQuery) {
          setActiveCategory(levelCats[0].name);
        }
      } else if (cats.length > 0 && !activeCategory) {
        setActiveCategory(cats[0].name);
      }
    } catch (err) {
      console.error('Error fetching vocabulary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeLevel, activeCategory, searchQuery]);

  const handleActivityComplete = async (
    earnedPoints: number,
    accuracy: number,
    details?: { attempts?: number; moves?: number; correctSentences?: number; correctWords?: number; matchedWords?: number }
  ) => {
    const wordCountAdd = details?.matchedWords ?? (vocabulary.length || 20);

    // Mark current category as completed
    const updatedCompleted = Array.from(new Set([...completedCategories, activeCategory]));
    setCompletedCategories(updatedCompleted);

    // Default categories list per level (6 categories per level)
    const defaultCategoriesByLevel: Record<number, string[]> = {
      1: ['Saludos y presentaciones', 'Familia y amigos', 'Números y colores', 'Comida y bebida', 'Casa y objetos cotidianos', 'Verbos básicos A1'],
      2: ['Ropa y accesorios', 'Ciudad y lugares', 'Días, meses y tiempo', 'Animales y naturaleza', 'Cuerpo humano y salud', 'Trabajos y profesiones'],
      3: ['Transporte y viajes', 'Compras y dinero', 'Escuela y estudio', 'Clima y estaciones', 'Deportes y pasatiempos', 'Emociones y adjetivos'],
      4: ['Tecnología y medios', 'Rutina diaria y hábitos', 'Cocina y restauración', 'Direcciones y orientación', 'Fiestas y eventos', 'Comunicación básica'],
      5: ['Expresiones comunes A1', 'Preguntas y conectores', 'Descripciones A1', 'Cultura y viajes', 'Emergencias y salud', 'Vocabulario general A1']
    };

    const currentLevelCatsFromState = categories.filter(c => Number(c.level) === Number(activeLevel));
    const allExpectedCatNames = Array.from(new Set([
      ...(defaultCategoriesByLevel[activeLevel] || []),
      ...currentLevelCatsFromState.map(c => c.name)
    ]));

    const allLevelCatsCompleted = allExpectedCatNames.length > 0 && allExpectedCatNames.every(cName => updatedCompleted.includes(cName));

    const nextUnlockedLevel = (allLevelCatsCompleted && activeLevel < 5 && accuracy >= 80)
      ? Math.max(user?.unlockedLevel || 1, activeLevel + 1)
      : (user?.unlockedLevel || 1);

    try {
      if (user) {
        const res = await api.saveProgress({
          pointsEarned: earnedPoints,
          levelCompleted: activeLevel,
          categoryCompleted: activeCategory,
          accuracy,
          studySeconds: 120,
          activityType: activeActivity,
          matchedWords: wordCountAdd,
          moves: details?.moves,
          attempts: details?.attempts,
          correctSentences: details?.correctSentences,
          correctWords: details?.correctWords,
          activeLevel: activeLevel
        });
        if (res && res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
        loadLeaderboards(rankingLevel);
      }
    } catch (err) {
      console.error('Error al registrar progreso:', err);
    }

    // Determine Learning Path Suggestion
    const currentIdx = allExpectedCatNames.indexOf(activeCategory);
    
    // Check if there is an uncompleted next category in this level
    const nextCatInLevel = allExpectedCatNames.find((cName, idx) => idx > currentIdx && !updatedCompleted.includes(cName))
      || allExpectedCatNames.find(cName => cName !== activeCategory && !updatedCompleted.includes(cName));

    if (!allLevelCatsCompleted && nextCatInLevel) {
      const nextCatObj = currentLevelCatsFromState.find(c => c.name === nextCatInLevel);
      // Suggest moving to next category in current level
      setTimeout(() => {
        setSuggestionModal({
          isOpen: true,
          type: 'category',
          currentCategory: activeCategory,
          nextCategory: nextCatInLevel,
          nextCategoryWords: nextCatObj?.totalWords || 20
        });
      }, 800);
    } else if (allLevelCatsCompleted && activeLevel < 5) {
      // ALL 6 categories in this level are completed! Suggest next level
      setTimeout(() => {
        setSuggestionModal({
          isOpen: true,
          type: 'level',
          completedLevel: activeLevel,
          nextLevel: activeLevel + 1
        });
      }, 800);
    }
  };

  // Compute daily goal percentage
  const goalPercent = Math.min(100, Math.round((todayCompletedCount / dailyTarget) * 100));
  const strokeDashoffset = 283 - (283 * goalPercent) / 100;

  // Filter categories to display for active level
  const displayedCategories = categories.filter(c => c.level === activeLevel);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Search & Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar cualquier palabra A1..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Level Badges Selector Pill */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[1, 2, 3, 4, 5].map(levelNum => {
            const isUnlocked = !user || levelNum <= (user.unlockedLevel || 1);
            const isActive = activeLevel === levelNum;
            return (
              <button
                key={levelNum}
                onClick={() => isUnlocked && setActiveLevel(levelNum)}
                disabled={!isUnlocked}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center space-x-1 transition-all border whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : isUnlocked
                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                }`}
              >
                {!isUnlocked ? <Lock className="w-3 h-3 text-slate-400" /> : <BookOpen className="w-3 h-3" />}
                <span>Nivel {levelNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 12-Column Bento Grid Container */}
      <div className="grid grid-cols-12 gap-5">

        {/* BENTO CARD 1: Level Progression Selector (Col 3, Row 4) */}
        <div className="col-span-12 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Niveles A1 CEFR</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Ruta de Aprendizaje</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completa las palabras de cada tema para desbloquear el siguiente nivel.</p>
          </div>

          <div className="space-y-2.5 my-auto">
            {[
              { lvl: 1, name: 'Principiante', count: '100+ palabras', color: 'from-blue-500 to-indigo-600' },
              { lvl: 2, name: 'Básico', count: '120+ palabras', color: 'from-indigo-500 to-purple-600' },
              { lvl: 3, name: 'Intermedio Bajo', count: '130+ palabras', color: 'from-purple-500 to-pink-600' },
              { lvl: 4, name: 'Intermedio', count: '140+ palabras', color: 'from-pink-500 to-rose-600' },
              { lvl: 5, name: 'Avanzado A1', count: '140+ palabras', color: 'from-amber-500 to-emerald-600' }
            ].map(l => {
              const isUnlocked = !user || l.lvl <= (user.unlockedLevel || 1);
              const isActive = activeLevel === l.lvl;
              const levelCatList = categories.filter(c => c.level === l.lvl);
              const completedInLvl = levelCatList.filter(c => completedCategories.includes(c.name)).length;

              return (
                <button
                  key={l.lvl}
                  onClick={() => isUnlocked && setActiveLevel(l.lvl)}
                  disabled={!isUnlocked}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-200 shadow-xs'
                      : isUnlocked
                      ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                      : 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isActive ? 'bg-indigo-600 text-white' : isUnlocked ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {l.lvl}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{l.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {levelCatList.length > 0 ? `${completedInLvl}/${levelCatList.length} Temas completados` : l.count}
                      </div>
                    </div>
                  </div>
                  {isUnlocked ? (
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block">
              Nivel Actual: {activeLevel} / 5
            </span>
            <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(activeLevel / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* BENTO CARD 2: Main Activity & Interactive Stage (Col 6, Row 4) */}
        <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          {/* Activity Modes Header Pills */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex space-x-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveActivity('flashcards')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  activeActivity === 'flashcards'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Flashcards ({vocabulary.length})</span>
              </button>

              <button
                onClick={() => setActiveActivity('dragdrop')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  activeActivity === 'dragdrop'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5" />
                <span>Arrastrar ({vocabulary.length})</span>
              </button>

              <button
                onClick={() => setActiveActivity('memory')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  activeActivity === 'memory'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Memoria ({vocabulary.length})</span>
              </button>

              <button
                onClick={() => setActiveActivity('fillblanks')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  activeActivity === 'fillblanks'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Completar</span>
              </button>

              <button
                onClick={() => setActiveActivity('listening')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  activeActivity === 'listening'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Ear className="w-3.5 h-3.5" />
                <span>Listening</span>
              </button>
            </div>
          </div>

          {/* Interactive Stage Render */}
          <div className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Cargando vocabulario...</p>
              </div>
            ) : vocabulary.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No se encontraron palabras para los filtros seleccionados.
              </div>
            ) : (
              <>
                {activeActivity === 'flashcards' && (
                  <Flashcards words={vocabulary} onComplete={handleActivityComplete} />
                )}
                {activeActivity === 'dragdrop' && (
                  <DragAndDrop words={vocabulary} onComplete={handleActivityComplete} />
                )}
                {activeActivity === 'memory' && (
                  <MemoryGame words={vocabulary} onComplete={handleActivityComplete} />
                )}
                {activeActivity === 'fillblanks' && (
                  <FillBlanks words={vocabulary} onComplete={handleActivityComplete} />
                )}
                {activeActivity === 'listening' && (
                  <ListeningActivity words={vocabulary} onComplete={handleActivityComplete} />
                )}
              </>
            )}
          </div>
        </div>

        {/* BENTO CARD 3: Daily Goal Circular Progress Ring (Col 3, Row 2) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between text-center">
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Meta Diaria</span>
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>

          {/* Circular SVG Ring */}
          <div className="relative w-28 h-28 my-2 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-indigo-600 transition-all duration-700 ease-out"
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{todayCompletedCount}</span>
              <span className="text-[10px] text-slate-400 font-bold">/ {dailyTarget} palabras</span>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {goalPercent >= 100 ? '🎉 ¡Meta Diaria Alcanzada!' : `¡Faltan ${dailyTarget - todayCompletedCount} palabras hoy!`}
          </p>
        </div>

        {/* BENTO CARD 4: Streak & Mastery Card (Col 3, Row 2 - Emerald Gradient) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Racha Activa
              </span>
              <h4 className="text-2xl font-black mt-1">{user?.streak || 5} Días Seguidos</h4>
            </div>
            <Flame className="w-8 h-8 text-amber-300 fill-amber-300 animate-pulse" />
          </div>

          <div className="space-y-1 my-2">
            <p className="text-xs text-emerald-100">Insignia de Nivel:</p>
            <div className="flex items-center space-x-1.5 bg-white/10 rounded-xl p-2 font-bold text-xs backdrop-blur-xs">
              <Award className="w-4 h-4 text-amber-300" />
              <span>{user?.badges?.[0] || 'Principiante A1'}</span>
            </div>
          </div>

          <span className="text-[11px] text-emerald-100 font-medium">¡Estudiaste hoy! Sigue así para conservar tu racha.</span>
        </div>

        {/* BENTO CARD 5: Category Filter Cards Grid for Active Level (Col 12) */}
        <div className="col-span-12 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Categorías del Nivel {activeLevel}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {displayedCategories.filter(c => completedCategories.includes(c.name)).length} / {displayedCategories.length} Temas completados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {(displayedCategories.length > 0 ? displayedCategories : categories).map((cat, idx) => {
              const isActive = activeCategory === cat.name;
              const isCompleted = completedCategories.includes(cat.name);

              return (
                <button
                  key={idx}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102 ring-2 ring-indigo-300'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold truncate pr-1">{cat.name}</span>
                    {isCompleted && (
                      <span className={`p-0.5 rounded-full shrink-0 ${isActive ? 'bg-indigo-700 text-emerald-300' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300'}`}>
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold mt-2 ${isActive ? 'text-indigo-100' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {cat.totalWords} palabras {isCompleted && '• ✓'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* SECCIÓN DEDICADA DE RANKINGS: 5 TARJETAS INDEPENDIENTES POR ACTIVIDAD */}
      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-amber-500 font-extrabold text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Tablas de Clasificación Oficiales</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Rankings de la Comunidad por Actividad
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualiza el progreso de los estudiantes registrados en 5 tarjetas independientes.
            </p>
          </div>

          {/* Level Filter for Leaderboards */}
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">Filtrar por Nivel:</span>
            {[1, 2, 3, 4, 5].map(lvl => (
              <button
                key={lvl}
                onClick={() => setRankingLevel(lvl)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  rankingLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Nivel {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Distinct Cards in Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* 1. Ranking Global XP */}
          <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-lg flex flex-col justify-between space-y-3 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white leading-tight">1. Ranking XP Global</h4>
                  <span className="text-[10px] text-amber-300 font-medium block">Puntos acumulados</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 min-h-[160px]">
              {loadingLeaderboard ? (
                <div className="text-xs text-slate-400 text-center py-8">Cargando XP...</div>
              ) : globalLb.length > 0 ? (
                globalLb.map((st, idx) => {
                  const isMe = !!(user && (user.id === st.id || (user.email && user.email === st.email)));
                  return (
                    <div
                      key={st.id || idx}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                        isMe
                          ? 'bg-indigo-900/80 border-indigo-500 text-white font-bold ring-1 ring-indigo-400'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                          st.rank === 1 ? 'bg-amber-400 text-slate-900' : st.rank === 2 ? 'bg-slate-300 text-slate-900' : st.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {st.rank || idx + 1}
                        </span>
                        <span className="truncate max-w-[85px] font-semibold">{st.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full shrink-0 border border-amber-500/30">
                        {st.points} XP
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-8 font-medium">Sin registros</div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 text-center border-t border-slate-800/80 pt-2 font-medium">
              Top XP general de estudiantes
            </div>
          </div>

          {/* 2. Ranking Drag & Drop */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">2. Arrastrar y Soltar</h4>
                  <span className="text-[10px] text-slate-400 font-medium block">Intentos Acumulados Nivel {rankingLevel}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 min-h-[160px]">
              {loadingLeaderboard ? (
                <div className="text-xs text-slate-400 text-center py-8">Cargando...</div>
              ) : dragdropLb.length > 0 ? (
                dragdropLb.map((st, idx) => {
                  const isMe = !!(user && (user.id === st.id || (user.email && user.email === st.email)));
                  const val = st.aciertos ?? st.dragMatchedWords ?? st.matchedWords;
                  const att = st.attempts ?? null;
                  return (
                    <div
                      key={st.id || idx}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                        isMe
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                          st.rank === 1 ? 'bg-amber-400 text-slate-900' : st.rank === 2 ? 'bg-slate-300 text-slate-900' : st.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {st.rank || idx + 1}
                        </span>
                        <span className="truncate max-w-[70px] font-semibold">{st.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full shrink-0 border border-indigo-100 dark:border-indigo-900">
                        {att !== null && att !== undefined ? `${att} ${att === 1 ? 'intento' : 'intentos'}` : val !== null && val !== undefined && val > 0 ? `${val} parejas` : '-'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-8 font-medium">Sin registros</div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
              Intentos Acumulados Nivel {rankingLevel}
            </div>
          </div>

          {/* 3. Ranking Juego de Memoria */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">3. Juego de Memoria</h4>
                  <span className="text-[10px] text-slate-400 font-medium block">Movimientos Acumulados Nivel {rankingLevel}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 min-h-[160px]">
              {loadingLeaderboard ? (
                <div className="text-xs text-slate-400 text-center py-8">Cargando...</div>
              ) : memoryLb.length > 0 ? (
                memoryLb.map((st, idx) => {
                  const isMe = !!(user && (user.id === st.id || (user.email && user.email === st.email)));
                  const val = st.aciertos ?? st.matchedWords;
                  const moves = st.moves ?? null;
                  return (
                    <div
                      key={st.id || idx}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                        isMe
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                          st.rank === 1 ? 'bg-amber-400 text-slate-900' : st.rank === 2 ? 'bg-slate-300 text-slate-900' : st.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {st.rank || idx + 1}
                        </span>
                        <span className="truncate max-w-[70px] font-semibold">{st.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-full shrink-0 border border-purple-100 dark:border-purple-900">
                        {moves !== null && moves !== undefined ? `${moves} mov.` : '-'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-8 font-medium">Sin registros</div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
              Movimientos Acumulados Nivel {rankingLevel}
            </div>
          </div>

          {/* 4. Ranking Completar Frases */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">4. Completar Frases</h4>
                  <span className="text-[10px] text-slate-400 font-medium block">Frases Correctas Nivel {rankingLevel}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 min-h-[160px]">
              {loadingLeaderboard ? (
                <div className="text-xs text-slate-400 text-center py-8">Cargando...</div>
              ) : fillblanksLb.length > 0 ? (
                fillblanksLb.map((st, idx) => {
                  const isMe = !!(user && (user.id === st.id || (user.email && user.email === st.email)));
                  const val = st.correctSentences ?? st.aciertos;
                  const att = st.attempts ?? 1;
                  return (
                    <div
                      key={st.id || idx}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                        isMe
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                          st.rank === 1 ? 'bg-amber-400 text-slate-900' : st.rank === 2 ? 'bg-slate-300 text-slate-900' : st.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {st.rank || idx + 1}
                        </span>
                        <span className="truncate max-w-[70px] font-semibold">{st.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full shrink-0 border border-emerald-100 dark:border-emerald-900">
                        {val !== null && val !== undefined ? `${val} ${val === 1 ? 'frase' : 'frases'}` : '-'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-8 font-medium">Sin registros</div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
              Frases Correctas Nivel {rankingLevel}
            </div>
          </div>

          {/* 5. Ranking Listening Simple */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Ear className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">5. Listening Simple</h4>
                  <span className="text-[10px] text-slate-400 font-medium block">Audios Correctos Nivel {rankingLevel}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 min-h-[160px]">
              {loadingLeaderboard ? (
                <div className="text-xs text-slate-400 text-center py-8">Cargando...</div>
              ) : listeningLb.length > 0 ? (
                listeningLb.map((st, idx) => {
                  const isMe = !!(user && (user.id === st.id || (user.email && user.email === st.email)));
                  const val = st.correctWords ?? st.aciertos;
                  const att = st.attempts ?? 1;
                  return (
                    <div
                      key={st.id || idx}
                      className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                        isMe
                          ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                          st.rank === 1 ? 'bg-amber-400 text-slate-900' : st.rank === 2 ? 'bg-slate-300 text-slate-900' : st.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {st.rank || idx + 1}
                        </span>
                        <span className="truncate max-w-[70px] font-semibold">{st.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full shrink-0 border border-cyan-100 dark:border-cyan-900">
                        {val !== null && val !== undefined ? `${val} ${val === 1 ? 'audio' : 'audios'}` : '-'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 text-center py-8 font-medium">Sin registros</div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-2 font-medium">
              Audios Correctos Nivel {rankingLevel}
            </div>
          </div>
        </div>
      </div>

      {/* LEARNING PATH SUGGESTION MODAL OVERLAY */}
      {suggestionModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
            <button
              onClick={() => setSuggestionModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {suggestionModal.type === 'category' ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-8 h-8 animate-bounce" />
                </div>

                <div>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    ¡Tema Completado!
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    Has finalizado "{suggestionModal.currentCategory}"
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Sigue tu ruta de aprendizaje para dominar todo el vocabulario del Nivel {activeLevel}.
                  </p>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-left space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Siguiente Categoría Recomendada
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-indigo-950 dark:text-indigo-200">
                      {suggestionModal.nextCategory}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {suggestionModal.nextCategoryWords} palabras
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (suggestionModal.nextCategory) {
                        setActiveCategory(suggestionModal.nextCategory);
                      }
                      setSuggestionModal(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
                  >
                    <span>Pasar a {suggestionModal.nextCategory}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSuggestionModal(null)}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-2xl text-xs transition-all"
                  >
                    Repasar este tema de nuevo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-8 h-8 animate-bounce" />
                </div>

                <div>
                  <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    ¡Nivel {suggestionModal.completedLevel} Completado!
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                    ¡Completaste todas las categorías del Nivel {suggestionModal.completedLevel}!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Has repasado con éxito más de 100 palabras de este nivel. ¡Es hora de dar el siguiente paso!
                  </p>
                </div>

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-4 text-center shadow-md">
                  <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                    ¡Nuevo Nivel Desbloqueado!
                  </span>
                  <span className="text-lg font-black block mt-1">
                    Nivel {suggestionModal.nextLevel}
                  </span>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (suggestionModal.nextLevel) {
                        setActiveLevel(suggestionModal.nextLevel);
                      }
                      setSuggestionModal(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
                  >
                    <span>Desbloquear y Avanzar al Nivel {suggestionModal.nextLevel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSuggestionModal(null)}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-2xl text-xs transition-all"
                  >
                    Seguir explorando Nivel {suggestionModal.completedLevel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
