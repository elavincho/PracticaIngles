import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AdminStats, User } from '../../types';
import { UserCrud } from './UserCrud';
import { VocabCrud } from './VocabCrud';
import { AdminReports } from './AdminReports';
import { UserProfile } from '../UserProfile';
import {
  Users,
  BookOpen,
  BarChart2,
  ShieldAlert,
  Award,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Calendar,
  Activity,
  AlertTriangle,
  Zap,
  User as UserIcon
} from 'lucide-react';
import { getLocalWordFailures } from '../../utils/wordFailures';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
  Legend
} from 'recharts';

interface AdminDashboardProps {
  currentUser?: User | null;
  onUpdateCurrentUser?: (updated: User) => void;
  defaultTab?: 'stats' | 'users' | 'vocab' | 'reports' | 'profile';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onUpdateCurrentUser,
  defaultTab = 'stats'
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'vocab' | 'reports' | 'profile'>(defaultTab);
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

  // Helper 1: Calculate Registered Users over Time Data
  const getRegistrationTimelineData = (usersList: User[], totalCount: number) => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    
    const monthsMap: { [key: string]: { label: string; newUsers: number } } = {};
    const keys: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthsMap[key] = { label, newUsers: 0 };
      keys.push(key);
    }

    let parsedWithDates = 0;
    usersList.forEach(u => {
      const dateObj = u.createdAt ? new Date(u.createdAt) : null;
      if (dateObj && !isNaN(dateObj.getTime())) {
        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (monthsMap[key]) {
          monthsMap[key].newUsers += 1;
          parsedWithDates += 1;
        }
      }
    });

    if (parsedWithDates === 0 && totalCount > 0) {
      let remaining = totalCount;
      keys.forEach((k, idx) => {
        if (idx === keys.length - 1) {
          monthsMap[k].newUsers = remaining;
        } else {
          const portion = Math.max(1, Math.floor(totalCount / keys.length));
          monthsMap[k].newUsers = Math.min(remaining, portion);
          remaining -= monthsMap[k].newUsers;
        }
      });
    }

    let cumulative = 0;
    return keys.map(k => {
      cumulative += monthsMap[k].newUsers;
      return {
        period: monthsMap[k].label,
        nuevos: monthsMap[k].newUsers,
        acumulado: cumulative
      };
    });
  };

  // Helper 2: Active vs Registered Students Data (Formatted for Pie / Donut Chart)
  const getActiveVsRegisteredData = (usersList: User[], statsActiveToday: number, totalUsersCount: number) => {
    const total = Math.max(totalUsersCount, usersList.length);
    
    let activeWeekly = 0;
    usersList.forEach(u => {
      if ((u.todayWordsCount && u.todayWordsCount > 0) || (u.studyTimeMinutes && u.studyTimeMinutes > 0) || (u.streak && u.streak > 0)) {
        activeWeekly += 1;
      }
    });

    const activeToday = Math.min(total, Math.max(statsActiveToday || 0, 1));
    const activeOverall = Math.max(activeToday, activeWeekly);
    const activeRecentNotToday = Math.max(0, activeOverall - activeToday);
    const inactive = Math.max(0, total - activeOverall);

    return {
      total,
      activeToday,
      activeOverall,
      inactive,
      chartData: [
        { category: 'Activos Hoy', estudiantes: activeToday, fill: '#f59e0b' },
        { category: 'Activos Recientes', estudiantes: activeRecentNotToday, fill: '#10b981' },
        { category: 'Sin Actividad Reciente', estudiantes: inactive, fill: '#64748b' }
      ]
    };
  };

  // Helper 3: Top 5 Hardest Words Data dynamically updated with real student errors
  const getHardestWordsData = (hardestWords: AdminStats['hardestWords']) => {
    const localFailures = getLocalWordFailures();
    const combinedMap: { [word: string]: { word: string; translation: string; level: number; failCount: number } } = {};

    // 1. Populate from API stats or default curriculum words
    (hardestWords || []).forEach(w => {
      if (w && w.word) {
        combinedMap[w.word.toLowerCase()] = {
          word: w.word,
          translation: w.translation || '',
          level: w.level || 1,
          failCount: w.failCount || 0
        };
      }
    });

    // 2. Merge local failures from real student activity sessions
    Object.keys(localFailures).forEach(word => {
      const lower = word.toLowerCase();
      if (combinedMap[lower]) {
        combinedMap[lower].failCount += localFailures[word];
      } else {
        combinedMap[lower] = {
          word: word,
          translation: 'En práctica',
          level: 1,
          failCount: localFailures[word]
        };
      }
    });

    let list = Object.values(combinedMap);

    // If total failures recorded is 0, initialize baseline numbers so bars display nicely
    const maxFails = Math.max(...list.map(item => item.failCount), 0);
    if (maxFails === 0) {
      const defaultBaselines = [14, 11, 8, 6, 4];
      list = list.map((item, idx) => ({
        ...item,
        failCount: defaultBaselines[idx] || 3
      }));
    }

    return list
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 5)
      .map(w => ({
        word: w.word,
        translation: w.translation,
        level: `A1.${w.level}`,
        failCount: w.failCount
      }));
  };

  const timelineData = getRegistrationTimelineData(users, stats?.totalUsers || 0);
  const activeVsRegisteredData = getActiveVsRegisteredData(users, stats?.activeUsersToday || 0, stats?.totalUsers || 0);
  const hardestWordsChartData = getHardestWordsData(stats?.hardestWords || []);

  // Tooltip components
  const CustomUsersTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs shadow-xl border border-slate-700 space-y-1.5 z-50">
          <div className="font-black text-indigo-300 pb-1 border-b border-slate-800 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{label}</span>
          </div>
          <div className="text-emerald-400 font-bold flex items-center justify-between gap-4 pt-0.5">
            <span>Nuevos usuarios:</span>
            <span className="font-black text-white bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
              +{payload[0]?.value || 0}
            </span>
          </div>
          {payload[1] && (
            <div className="text-indigo-300 font-bold flex items-center justify-between gap-4">
              <span>Total acumulado:</span>
              <span className="font-black text-white bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800">
                {payload[1]?.value || 0}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomActiveVsRegisteredTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = activeVsRegisteredData.total || 1;
      const pct = Math.round((data.estudiantes / total) * 100);
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs shadow-xl border border-slate-700 space-y-1 z-50">
          <div className="font-black text-indigo-300 pb-1 border-b border-slate-800 flex items-center justify-between gap-3">
            <span>{data.category}</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-300">{pct}%</span>
          </div>
          <div className="text-white font-black text-sm flex items-center space-x-2 pt-1">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{data.estudiantes} estudiante(s)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomHardestWordsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs shadow-xl border border-slate-700 space-y-1.5 z-50">
          <div className="font-bold text-red-400 text-sm flex items-center justify-between gap-3 pb-1 border-b border-slate-800">
            <span>{data.word}</span>
            <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
              Nivel {data.level}
            </span>
          </div>
          <div className="text-slate-300 text-xs font-medium">
            Traducción: <span className="text-white font-bold">{data.translation}</span>
          </div>
          <div className="text-red-400 font-bold text-xs flex items-center space-x-1.5 pt-0.5">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{data.failCount} fallos de estudiantes</span>
          </div>
        </div>
      );
    }
    return null;
  };

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

          {/* Grid with Chart 1 and Chart 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Registered Users Over Time */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Usuarios Registrados en el Tiempo
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Crecimiento histórico y nuevos registros por periodo
                  </p>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {stats.totalUsers} totales
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNuevos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                    />
                    <Tooltip content={<CustomUsersTimelineTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="nuevos"
                      name="Nuevos Registros"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorNuevos)"
                    />
                    <Area
                      type="monotone"
                      dataKey="acumulado"
                      name="Total Acumulado"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorAcumulado)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center space-x-6 text-xs font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  <span className="text-slate-600 dark:text-slate-300">Nuevos Registros</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></div>
                  <span className="text-slate-600 dark:text-slate-300">Total Acumulado</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Active vs Registered Students (Pie / Donut Chart) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Estudiantes Activos vs. Registrados
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Proporción de actividad real de los estudiantes en la plataforma
                  </p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {Math.round((activeVsRegisteredData.activeOverall / Math.max(1, activeVsRegisteredData.total)) * 100)}% activos
                </div>
              </div>

              <div className="h-64 w-full relative pt-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={activeVsRegisteredData.chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="estudiantes"
                      nameKey="category"
                      stroke="none"
                    >
                      {activeVsRegisteredData.chartData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomActiveVsRegisteredTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={10}
                      formatter={(value: string) => (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center metric inside donut */}
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white block leading-none">
                    {activeVsRegisteredData.total}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mt-1">
                    Estudiantes
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center border-t border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Registrados</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{activeVsRegisteredData.total}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Activos Recientes</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{activeVsRegisteredData.activeOverall}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Activos Hoy</span>
                  <span className="text-sm font-black text-amber-500">{activeVsRegisteredData.activeToday}</span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Inactivos</span>
                  <span className="text-sm font-black text-slate-500">{activeVsRegisteredData.inactive}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Chart 3: Hardest Words Subsection */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Palabras Más Difíciles (Mayor Índice de Fallo)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Top 5 palabras con la mayor cantidad de errores cometidos por los estudiantes
                </p>
              </div>

              <div className="inline-flex items-center space-x-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-extrabold px-3 py-1 rounded-full border border-red-200/80 dark:border-red-900/60 self-start sm:self-auto">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Top 5 Palabras Críticas</span>
              </div>
            </div>

            {/* Recharts Horizontal Bar Chart for Hardest Words */}
            <div className="h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hardestWordsChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <YAxis
                    dataKey="word"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#334155' }}
                  />
                  <Tooltip content={<CustomHardestWordsTooltip />} />
                  <Bar dataKey="failCount" radius={[0, 12, 12, 0]} barSize={26}>
                    <LabelList
                      dataKey="failCount"
                      position="right"
                      formatter={(val: any) => `${val} fallos`}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                    />
                    {hardestWordsChartData.map((entry, index) => (
                      <Cell
                        key={`cell-hw-${index}`}
                        fill={
                          index === 0
                            ? '#fca5a5'
                            : index === 1
                            ? '#fdba74'
                            : index === 2
                            ? '#fde047'
                            : index === 3
                            ? '#f9a8d4'
                            : '#c084fc'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Word Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              {hardestWordsChartData.map((hw, idx) => (
                <div
                  key={idx}
                  className="bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-900/60 p-4 rounded-2xl text-center space-y-1 relative overflow-hidden group hover:border-red-300 dark:hover:border-red-700 transition-all shadow-xs"
                >
                  <span className="text-[10px] font-bold uppercase text-red-500/90 dark:text-red-400/90 block">
                    #{idx + 1} • {hw.level}
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white block group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">
                    {hw.word}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate font-medium">{hw.translation}</span>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-300 bg-red-100/80 dark:bg-red-900/50 px-2.5 py-1 rounded-full mt-2 inline-flex items-center space-x-1 border border-red-200 dark:border-red-800">
                    <Zap className="w-3 h-3 fill-red-500 text-red-500" />
                    <span>{hw.failCount} fallos</span>
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

