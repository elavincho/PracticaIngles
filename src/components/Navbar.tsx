import React, { useState } from 'react';
import { User } from '../types';
import { Flame, Sparkles, Sun, Moon, LogIn, LogOut, ShieldAlert, BookOpen, Database, Menu, X, User as UserIcon } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full max-w-7xl mx-auto px-4 py-3 relative z-40">
      <div className="flex items-center justify-between">
        {/* Brand logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs rounded-full px-3 sm:px-4 py-1.5 sm:py-2 space-x-2">
            <div className="bg-indigo-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold text-[11px] sm:text-xs shadow-xs shrink-0">
              A1
            </div>
            <span className="font-bold text-slate-800 dark:text-white tracking-tight text-xs sm:text-sm md:text-base">
              VocabMaster <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">English</span>
            </span>
            <span className="hidden sm:inline-block bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium border border-indigo-100 dark:border-indigo-800 shrink-0">
              CEFR A1
            </span>
          </div>

          {/* Database connection badge - Desktop */}
          <div className={`hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
            dbConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}>
            <Database className="w-3.5 h-3.5" />
            <span>{dbConnected ? 'DB Conectada' : 'DB Desconectada'}</span>
          </div>

          {/* Admin badge - Desktop */}
          {user?.role === 'admin' && (
            <div className="hidden lg:flex bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-full px-3 py-1 items-center space-x-1.5 text-xs font-semibold shadow-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Admin</span>
            </div>
          )}
        </div>

        {/* Desktop Controls (lg screens) */}
        <div className="hidden lg:flex items-center space-x-3">
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
                <span>Estudiante</span>
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
                <span>Panel Admin</span>
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

          {/* Dark/Light mode toggle button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Auth Action */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-white">{user.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Nivel {user.unlockedLevel || activeLevel}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-full text-xs sm:text-sm flex items-center space-x-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
          )}
        </div>

        {/* Mobile Header Actions (Dark mode toggle + Hamburger button) */}
        <div className="flex lg:hidden items-center space-x-2">
          {/* Quick theme toggle for mobile */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            aria-label="Menú principal"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col space-y-3.5 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info header if logged in */}
          {user ? (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user.role === 'admin' ? 'Administrador' : `Estudiante • Nivel ${user.unlockedLevel || activeLevel}`}
                  </div>
                </div>
              </div>

              {user.role === 'admin' && (
                <span className="bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                  Admin
                </span>
              )}
            </div>
          ) : null}

          {/* DB Connection Badge */}
          <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold border ${
            dbConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}>
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>{dbConnected ? 'Base de Datos Conectada' : 'Base de Datos Desconectada'}</span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          {/* Admin Navigation Switcher */}
          {user?.role === 'admin' && (
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl grid grid-cols-2 gap-1 text-xs font-medium border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => handleMobileNav(() => setCurrentView('student'))}
                className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  currentView === 'student'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Vista Estudiante</span>
              </button>
              <button
                onClick={() => handleMobileNav(() => setCurrentView('admin'))}
                className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Panel Admin</span>
              </button>
            </div>
          )}

          {/* Student Badges */}
          {user && currentView === 'student' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-2.5 flex items-center justify-center space-x-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span>{user.streak || 1} días racha</span>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-2.5 flex items-center justify-center space-x-2 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                <span>{user.points || 0} XP</span>
              </div>
            </div>
          )}

          {/* Auth Action Button */}
          {user ? (
            <button
              onClick={() => handleMobileNav(onLogout)}
              className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          ) : (
            <button
              onClick={() => handleMobileNav(onOpenAuth)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-98 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
