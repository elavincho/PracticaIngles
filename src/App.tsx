import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { BentoDashboard } from './components/BentoDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { Database, AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('vocab_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [dbChecked, setDbChecked] = useState<boolean>(false);

  // Check DB connection status
  const checkDb = async () => {
    try {
      const health = await api.checkHealth();
      setDbConnected(health.dbConnected);
    } catch {
      setDbConnected(false);
    } finally {
      setDbChecked(true);
    }
  };

  useEffect(() => {
    checkDb();
    const interval = setInterval(checkDb, 15000); // Check health every 15s
    return () => clearInterval(interval);
  }, []);

  // Toggle dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vocab_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vocab_theme', 'light');
    }
  }, [darkMode]);

  // Try retrieving user profile on load if token present
  useEffect(() => {
    const token = localStorage.getItem('vocab_token');
    if (token) {
      api.getProfile()
        .then(u => {
          setUser(u);
          if (u.role === 'admin') {
            setCurrentView('admin');
          }
        })
        .catch(() => {
          localStorage.removeItem('vocab_token');
          setUser(null);
        });
    } else {
      // Default: require login screen on start
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vocab_token');
    setUser(null);
    setCurrentView('student');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* DB Connection Alert Banner when disconnected */}
      {dbChecked && !dbConnected && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md">
          <div className="max-w-7xl mx-auto w-full flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 animate-bounce" />
            <span>
              <strong>Base de Datos no conectada:</strong> Conecte MongoDB Atlas para iniciar sesión, registrar estudiantes y guardar su progreso.
            </span>
          </div>
          <button
            onClick={checkDb}
            className="ml-4 shrink-0 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-md text-xs font-bold transition-all"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeLevel={user?.unlockedLevel || 1}
        dbConnected={dbConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12 flex flex-col justify-center">
        {!user ? (
          <LoginScreen
            onSuccess={(u) => {
              setUser(u);
              if (u.role === 'admin') {
                setCurrentView('admin');
              }
            }}
            dbConnected={dbConnected}
            onCheckDb={checkDb}
          />
        ) : currentView === 'admin' && user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <BentoDashboard
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            onRequireAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Auth Modal (for when user wants to switch account or re-authenticate from navbar) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          if (u.role === 'admin') {
            setCurrentView('admin');
          }
        }}
      />
    </div>
  );
}
