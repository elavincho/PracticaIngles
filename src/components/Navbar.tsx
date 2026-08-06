import React from 'react';
import { User } from '../types';
import { Flame, Sparkles, Sun, Moon, LogIn, LogOut, ShieldAlert, Award, BookOpen, Database } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  currentView: 'student' | 'admin';
  setCurrentView: (view: 'student' | 'admin') => void;
  activeLevel: number;
  dbConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  darkMode,
  setDarkMode,
  onOpenAuth,
  onLogout,
  currentView,
  setCurrentView,
  activeLevel,
  dbConnected
}) => {
  return (
    <header className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between z-30">
      {/* Brand logo in Bento Pill style */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs rounded-full px-4 py-2 space-x-2">
          <div className="bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs shadow-xs">
            A1
          </div>
          <span className="font-bold text-slate-800 dark:text-white tracking-tight text-sm sm:text-base">
            VocabMaster <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">English</span>
          </span>
          <span className="hidden sm:inline-block bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-indigo-100 dark:border-indigo-800">
            CEFR A1
          </span>
        </div>

        {/* Database connection badge */}
        <div className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
          dbConnected
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
        }`}>
          <Database className="w-3.5 h-3.5" />
          <span>{dbConnected ? 'DB Conectada' : 'DB Desconectada'}</span>
        </div>

        {user?.role === 'admin' && (
          <div className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-full px-3 py-1 flex items-center space-x-1.5 text-xs font-semibold shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Admin</span>
          </div>
        )}
      </div>

      {/* Navigation Controls & User Stats */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {user?.role === 'admin' && (
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex text-xs font-medium border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentView('student')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center space-x-1 ${
                currentView === 'student'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Estudiante</span>
            </button>
            <button
              onClick={() => setCurrentView('admin')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center space-x-1 ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Panel Admin</span>
            </button>
          </div>
        )}

        {/* User Badges: Streak & Points */}
        {user && currentView === 'student' && (
          <div className="flex items-center space-x-2">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-full px-3 py-1.5 flex items-center space-x-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{user.streak || 1} días</span>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-full px-3 py-1.5 flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
              <span>{user.points || 0} XP</span>
            </div>
          </div>
        )}

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Auth Action */}
        {user ? (
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-white">{user.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Nivel {user.unlockedLevel || 1}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-sm active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Ingresar</span>
          </button>
        )}
      </div>
    </header>
  );
};
