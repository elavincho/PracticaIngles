import React, { useState, useEffect, useRef } from 'react';
import { User, VocabularyWord, ActivityType, CategoryInfo } from '../types';
import { api } from '../services/api';
import { Flashcards } from './activities/Flashcards';
import { DragAndDrop } from './activities/DragAndDrop';
import { MemoryGame } from './activities/MemoryGame';
import { FillBlanks } from './activities/FillBlanks';
import { ListeningActivity } from './activities/ListeningActivity';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { getDailyLogs, recordWordsForToday, calculateRealStreak, getRealWeeklyData } from '../utils/dailyLogs';
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
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  LogOut,
  TrendingUp,
  BarChart3,
  Calendar,
  Play
} from 'lucide-react';

interface BentoDashboardProps {
  user: User | null;
  onUpdateUser?: (updated: User) => void;
  onRequireAuth: () => void;
}

// Custom Tooltip component for Recharts Weekly Progress Chart
const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs shadow-xl border border-slate-700 space-y-1 z-50">
        <div className="font-extrabold text-indigo-300 flex items-center justify-between gap-3">
          <span>{data.day}</span>
          {data.isToday && (
            <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-wider">
              Hoy
            </span>
          )}
        </div>
        <div className="text-white font-extrabold text-sm flex items-center space-x-1.5 pt-0.5">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>{data.words} palabras aprendidas</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
          <span>Meta: {data.target} palabras</span>
          <span className={data.words >= data.target ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
            {data.words >= data.target ? '✓ Meta cumplida' : `${Math.round((data.words / data.target) * 100)}%`}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

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

  const isUserInitialized = useRef(false);

  // Activity Tabs Scroll Monitoring
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const checkTabScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
    }
  };

  useEffect(() => {
    checkTabScroll();
    const timer = setTimeout(checkTabScroll, 300);
    window.addEventListener('resize', checkTabScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkTabScroll);
    };
  }, [activeActivity]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -160 : 160;
      tabsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Activity In Progress & Exit Confirmation Modal State
  const [isActivityInProgress, setIsActivityInProgress] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'activity' | 'category' | 'level';
    value: any;
  } | null>(null);

  const getActivityDisplayName = (type: ActivityType): string => {
    switch (type) {
      case 'flashcards': return 'Flashcards';
      case 'dragdrop': return 'Emparejar';
      case 'memory': return 'Juego de Memoria';
      case 'fillblanks': return 'Completar Oraciones';
      case 'listening': return 'Listening';
      default: return 'Actividad';
    }
  };

  const handleAttemptActivityChange = (newActivity: ActivityType) => {
    if (newActivity === activeActivity) return;
    if (isActivityInProgress) {
      setPendingNavigation({ type: 'activity', value: newActivity });
      setShowExitModal(true);
    } else {
      setActiveActivity(newActivity);
      setIsActivityInProgress(false);
    }
  };

  const handleAttemptLevelChange = (newLevel: number) => {
    if (newLevel === activeLevel) return;
    if (isActivityInProgress) {
      setPendingNavigation({ type: 'level', value: newLevel });
      setShowExitModal(true);
    } else {
      setActiveLevel(newLevel);
      setIsActivityInProgress(false);
    }
  };

  const handleAttemptCategoryChange = (newCategory: string) => {
    if (newCategory === activeCategory) return;
    if (isActivityInProgress) {
      setPendingNavigation({ type: 'category', value: newCategory });
      setShowExitModal(true);
    } else {
      setActiveCategory(newCategory);
      setIsActivityInProgress(false);
    }
  };

  const handleExplicitExitClick = () => {
    setPendingNavigation(null);
    setShowExitModal(true);
  };

  const confirmExit = () => {
    if (pendingNavigation) {
      if (pendingNavigation.type === 'activity') {
        setActiveActivity(pendingNavigation.value);
      } else if (pendingNavigation.type === 'category') {
        setActiveCategory(pendingNavigation.value);
      } else if (pendingNavigation.type === 'level') {
        setActiveLevel(pendingNavigation.value);
      }
    }
    setIsActivityInProgress(false);
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  const cancelExit = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };

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

  // Calculate real streak & weekly chart data from local logs + user state
  const realStreak = calculateRealStreak(user?.id);
  const effectiveStreak = Math.max(realStreak, user?.streak || 0);

  const weeklyData = getRealWeeklyData(user?.id, dailyTarget).map(item => {
    if (item.isToday) {
      return { ...item, words: Math.max(item.words, todayCompletedCount) };
    }
    return item;
  });

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
        api.getVocabulary(activeLevel, activeCategory || undefined),
        api.getCategories()
      ]);
      setVocabulary(words);
      setCategories(cats);

      // Auto-select first category for current level if current activeCategory is not in current level
      const levelCats = cats.filter(c => c.level === activeLevel);
      if (levelCats.length > 0) {
        const isCurrentInLevel = levelCats.some(c => c.name === activeCategory);
        if (!isCurrentInLevel) {
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
  }, [activeLevel, activeCategory]);

  const handleActivityComplete = async (
    earnedPoints: number,
    accuracy: number,
    details?: { attempts?: number; moves?: number; correctSentences?: number; correctWords?: number; matchedWords?: number }
  ) => {
    setIsActivityInProgress(false);
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
        // Record activity completion in daily logs
        recordWordsForToday(wordCountAdd, user?.id);
        const newRealStreak = calculateRealStreak(user?.id);

        if (res && res.user && onUpdateUser) {
          const updatedUser = { ...res.user };
          updatedUser.streak = Math.max(newRealStreak, updatedUser.streak || 0);
          onUpdateUser(updatedUser);
        } else if (user && onUpdateUser) {
          onUpdateUser({
            ...user,
            points: (user.points || 0) + earnedPoints,
            streak: Math.max(newRealStreak, user.streak || 0),
            todayWordsCount: (user.todayWordsCount || 0) + wordCountAdd,
            completedCategories: updatedCompleted,
            unlockedLevel: nextUnlockedLevel
          });
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
      {/* Student Dashboard Header Banner with Streak Counter */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
      >
        {/* Background glow ambient effects */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10 w-full md:w-auto">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-xl sm:text-2xl font-black text-indigo-300">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
                ¡Hola, {user?.name || 'Estudiante'}!
              </h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                CEFR A1.{(user?.unlockedLevel || activeLevel)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
              Panel de aprendizaje interactivo de vocabulario en inglés
            </p>
          </div>
        </div>

        {/* Header Streak Counter & XP Badge */}
        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto justify-between md:justify-end">
          {/* Contador de 'Días de Racha' Banner Card */}
          <div className="bg-amber-500/15 border border-amber-500/40 hover:border-amber-400/60 transition-all rounded-2xl p-3 sm:px-4 flex items-center space-x-3 shadow-lg group">
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-400/40 group-hover:scale-105 transition-transform">
                <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl sm:text-2xl font-black text-amber-300 leading-none">
                  {effectiveStreak}
                </span>
                <span className="text-xs font-bold text-amber-200">
                  {effectiveStreak === 1 ? 'Día de Racha' : 'Días de Racha'}
                </span>
              </div>
              <p className="text-[10px] font-medium text-amber-200/80 mt-0.5 flex items-center space-x-1">
                {todayCompletedCount > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>¡Racha activa hoy!</span>
                  </span>
                ) : (
                  <span>Completa 1 actividad hoy</span>
                )}
              </p>
            </div>
          </div>

          {/* XP Points Card */}
          <div className="bg-indigo-500/15 border border-indigo-400/30 rounded-2xl p-3 sm:px-4 flex items-center space-x-3 shadow-lg">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300 fill-indigo-300" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-indigo-200 leading-none">
                {user?.points || 0}
              </div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                XP Puntos
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main 12-Column Bento Grid Container */}
      <div className="grid grid-cols-12 gap-5">

        {/* BENTO CARD 1: Level Progression Selector (Col 3, Row 4) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
          className="col-span-12 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
        >
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
                  onClick={() => isUnlocked && handleAttemptLevelChange(l.lvl)}
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
        </motion.div>

        {/* BENTO CARD 2: Main Activity & Interactive Stage (Col 6, Row 4) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          {/* Activity Modes Header Pills */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-2">
            <div className="relative flex items-center flex-1 min-w-0">
              {/* Left Scroll Arrow */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => scrollTabs('left')}
                  className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition-all shrink-0 mr-1 z-10 cursor-pointer"
                  title="Anterior"
                  aria-label="Ver actividades anteriores"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              {/* Scrollable Container */}
              <div
                ref={tabsContainerRef}
                onScroll={checkTabScroll}
                className="flex space-x-1.5 overflow-x-auto scrollbar-none scroll-smooth flex-1 py-0.5"
              >
                <button
                  onClick={() => handleAttemptActivityChange('flashcards')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                    activeActivity === 'flashcards'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Flashcards</span>
                </button>

                <button
                  onClick={() => handleAttemptActivityChange('dragdrop')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                    activeActivity === 'dragdrop'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Puzzle className="w-3.5 h-3.5" />
                  <span>Emparejar</span>
                </button>

                <button
                  onClick={() => handleAttemptActivityChange('memory')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                    activeActivity === 'memory'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Memoria</span>
                </button>

                <button
                  onClick={() => handleAttemptActivityChange('fillblanks')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                    activeActivity === 'fillblanks'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Completar</span>
                </button>

                <button
                  onClick={() => handleAttemptActivityChange('listening')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 ${
                    activeActivity === 'listening'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Ear className="w-3.5 h-3.5" />
                  <span>Listening</span>
                </button>
              </div>

              {/* Right Scroll Indicator Arrow Button */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => scrollTabs('right')}
                  className="px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black transition-all shrink-0 ml-1 z-10 flex items-center space-x-0.5 cursor-pointer animate-pulse shadow-xs"
                  title="Ver más actividades"
                  aria-label="Ver más actividades"
                >
                  <span className="text-[10px] uppercase tracking-wider font-extrabold hidden xs:inline">Más</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>

            {isActivityInProgress && (
              <button
                type="button"
                onClick={handleExplicitExitClick}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                title="Salir de la actividad actual"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
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
            ) : !isActivityInProgress ? (
              <motion.div
                key={`${activeActivity}-${activeCategory}-${activeLevel}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="py-8 px-6 text-center flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-indigo-50/50 via-white to-indigo-50/30 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 my-2 shadow-xs"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-100 dark:ring-indigo-950/80">
                  {activeActivity === 'flashcards' && <BookOpen className="w-8 h-8" />}
                  {activeActivity === 'dragdrop' && <Puzzle className="w-8 h-8" />}
                  {activeActivity === 'memory' && <Brain className="w-8 h-8" />}
                  {activeActivity === 'fillblanks' && <PenTool className="w-8 h-8" />}
                  {activeActivity === 'listening' && <Ear className="w-8 h-8" />}
                </div>

                <div className="space-y-1.5 max-w-md">
                  <div className="inline-flex items-center space-x-1.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200/80 dark:border-indigo-800">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{getActivityDisplayName(activeActivity)}</span>
                    <span>•</span>
                    <span>{activeCategory}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
                    ¿Listo para practicar esta actividad?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Practica las {vocabulary.length} palabras de este tema en el Nivel A1.{activeLevel} para ganar puntos XP y mantener tu racha.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActivityInProgress(true)}
                  className="mt-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all flex items-center space-x-2.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Actividad</span>
                </button>
              </motion.div>
            ) : (
              <>
                {activeActivity === 'flashcards' && (
                  <Flashcards words={vocabulary} onComplete={handleActivityComplete} onProgressChange={setIsActivityInProgress} />
                )}
                {activeActivity === 'dragdrop' && (
                  <DragAndDrop words={vocabulary} onComplete={handleActivityComplete} onProgressChange={setIsActivityInProgress} />
                )}
                {activeActivity === 'memory' && (
                  <MemoryGame words={vocabulary} onComplete={handleActivityComplete} onProgressChange={setIsActivityInProgress} />
                )}
                {activeActivity === 'fillblanks' && (
                  <FillBlanks words={vocabulary} onComplete={handleActivityComplete} onProgressChange={setIsActivityInProgress} />
                )}
                {activeActivity === 'listening' && (
                  <ListeningActivity words={vocabulary} onComplete={handleActivityComplete} onProgressChange={setIsActivityInProgress} />
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* BENTO CARD 3: Daily Goal Circular Progress Ring (Col 3, Row 2) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between text-center"
        >
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
        </motion.div>

        {/* BENTO CARD 4: Streak & Mastery Card (Col 3, Row 2 - Emerald Gradient) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-5 shadow-lg flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Racha Activa
              </span>
              <h4 className="text-2xl font-black mt-1">{effectiveStreak} {effectiveStreak === 1 ? 'Día Seguido' : 'Días Seguidos'}</h4>
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
        </motion.div>

        {/* BENTO CARD: Recharts Weekly Progress Chart (Col 6) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22, ease: 'easeOut' }}
          className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Progreso Semanal de Palabras
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Palabras aprendidas esta semana por día
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{weeklyData.reduce((acc, curr) => acc + curr.words, 0)} esta semana</span>
            </div>
          </div>

          <div className="w-full h-44 my-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.12} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)', radius: 8 }} />
                <Bar dataKey="words" radius={[6, 6, 0, 0]} maxBarSize={30}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isToday ? '#4f46e5' : entry.words >= entry.target ? '#10b981' : '#818cf8'}
                      opacity={entry.isToday ? 1 : entry.words > 0 ? 0.85 : 0.35}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                <span>Hoy</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Meta cumplida (≥20)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
                <span>Días previos</span>
              </span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Promedio: {Math.round(weeklyData.reduce((a, b) => a + b.words, 0) / 7)} p/día
            </span>
          </div>
        </motion.div>

        {/* BENTO CARD 5: Category Filter Cards Grid for Active Level (Col 12) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
          className="col-span-12 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
        >
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
                <motion.button
                  key={cat.name || idx}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.25 + (idx * 0.03), ease: 'easeOut' }}
                  onClick={() => handleAttemptCategoryChange(cat.name)}
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
                </motion.button>
              );
            })}
          </div>
        </motion.div>

      </div>

      {/* SECCIÓN DEDICADA DE RANKINGS: 5 TARJETAS INDEPENDIENTES POR ACTIVIDAD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800"
      >
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
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">2. Emparejar</h4>
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
      </motion.div>

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

      {/* MODAL DE CONFIRMACIÓN DE SALIDA DE ACTIVIDAD */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800 shadow-inner">
                <AlertTriangle className="w-7 h-7 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  ¿Salir de la actividad actual?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-2">
                  Tienes una práctica en curso en <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{getActivityDisplayName(activeActivity)}</span>. Si sales ahora, el progreso de esta sesión no se guardará. ¿Estás seguro de que deseas salir?
                </p>
              </div>

              {pendingNavigation && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>Destino: </span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">
                    {pendingNavigation.type === 'activity' && getActivityDisplayName(pendingNavigation.value)}
                    {pendingNavigation.type === 'level' && `Nivel ${pendingNavigation.value}`}
                    {pendingNavigation.type === 'category' && `Categoría "${pendingNavigation.value}"`}
                  </strong>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelExit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Continuar Practicando
                </button>
                <button
                  type="button"
                  onClick={confirmExit}
                  className="w-full bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-extrabold py-3 rounded-2xl text-xs sm:text-sm border border-slate-200 hover:border-rose-200 dark:border-slate-700 dark:hover:border-rose-800 transition-all active:scale-95 cursor-pointer"
                >
                  Sí, Salir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
