import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, Shield, Sparkles, BookOpen, Database, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSuccess: (user: User) => void;
  dbConnected: boolean;
  onCheckDb: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, dbConnected, onCheckDb }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let res;
      if (isRegister) {
        res = await api.register(name, email, password, role);
      } else {
        res = await api.login(email, password);
      }
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoRole: 'user' | 'admin') => {
    setLoading(true);
    setError('');
    try {
      const demoEmail = demoRole === 'admin' ? 'admin@vocabmaster.com' : 'user@vocabmaster.com';
      const demoPass = demoRole === 'admin' ? 'admin123' : '123456';
      const res = await api.login(demoEmail, demoPass);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con usuario demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Logo & Title */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-md mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            English A1 VocabMaster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isRegister ? 'Crea tu cuenta para guardar tu progreso' : 'Inicia sesión para acceder a tus actividades y racha'}
          </p>
        </div>

        {/* Database connection badge banner */}
        {!dbConnected && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 mb-5 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Base de datos desconectada</span>
              <span>Asegúrate de que la conexión a MongoDB esté activa para iniciar sesión o registrarte.</span>
            </div>
          </div>
        )}

        {/* Quick Demo Access Buttons */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3.5 mb-5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 text-center">
            🚀 Acceso Rápido 1-Clic
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('user')}
              disabled={loading}
              className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl p-2.5 text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all"
            >
              <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Como Estudiante</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-xl p-2.5 text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all"
            >
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Como Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl p-3 mb-4 text-center font-semibold">
            {error}
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Carlos Mendoza"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="estudiante@ejemplo.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Cuenta
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    role === 'user'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    role === 'admin'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Administrador
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Procesando...' : isRegister ? 'Registrarse e Iniciar' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-5 text-center space-y-2">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold block w-full"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate gratis aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};
