import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AdminStats, User } from '../../types';
import { UserCrud } from './UserCrud';
import { VocabCrud } from './VocabCrud';
import { AdminReports } from './AdminReports';
import { Users, BookOpen, BarChart2, ShieldAlert, Award, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'vocab' | 'reports'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers()
      ]);
      setStats(s);
      setUsers(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Panel de Control Administrativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Gestión del Sistema A1 VocabMaster</h1>
          <p className="text-xs text-slate-400 mt-1">Supervisión de usuarios, edición de vocabulario y métricas globales</p>
        </div>

        <button
          onClick={loadAdminData}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2 transition-all border border-slate-700 shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all border whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Estadísticas Generales</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all border whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all border whitespace-nowrap ${
            activeTab === 'vocab'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Vocabulario A1 ({stats?.totalVocab || 632})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all border whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Reportes y Analítica</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics in Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalUsers}</span>
                <span className="text-xs text-slate-400 block font-medium">Usuarios Registrados</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.avgProgress}%</span>
                <span className="text-xs text-slate-400 block font-medium">Progreso Promedio Global</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalVocab}</span>
                <span className="text-xs text-slate-400 block font-medium">Palabras A1 Registradas</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.activeUsersToday}</span>
                <span className="text-xs text-slate-400 block font-medium">Estudiantes Activos Hoy</span>
              </div>
            </div>
          </div>

          {/* Hardest Words Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Palabras Más Difíciles (Mayor Índice de Fallo)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {stats.hardestWords.map((hw, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 rounded-2xl text-center">
                  <span className="text-lg font-black text-slate-900 dark:text-white block">{hw.word}</span>
                  <span className="text-xs text-slate-500 block">{hw.translation}</span>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full mt-2 inline-block">
                    {hw.failCount} fallos
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <UserCrud users={users} onRefresh={loadAdminData} />
      )}

      {activeTab === 'vocab' && (
        <VocabCrud />
      )}

      {activeTab === 'reports' && (
        <AdminReports />
      )}
    </div>
  );
};
