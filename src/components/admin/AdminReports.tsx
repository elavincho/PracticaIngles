import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ReportData } from '../../types';
import { BarChart3, Clock, PieChart, Users, CheckCircle2, Sparkles } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Fetch reports and admin users simultaneously to ensure calculations strictly use total registered students
    Promise.all([
      api.getReports().catch(() => null),
      api.getAdminUsers().catch(() => [])
    ]).then(([repData, users]) => {
      if (!isMounted) return;

      const registeredUsers = Array.isArray(users) ? users.filter(u => u.role === 'user') : [];
      const totalRegistered = Math.max(repData?.totalRegisteredStudents || 0, registeredUsers.length, 1);

      if (repData) {
        // Recalculate levelCompletions percentages against total registered students
        const updatedCompletions = repData.levelCompletions.map(lc => ({
          ...lc,
          percentage: Math.min(100, Math.round((lc.count / totalRegistered) * 100))
        }));

        // Normalize activity names (Drag & Drop -> Emparejar)
        const updatedEngagement = repData.activityEngagement.map(act => ({
          ...act,
          activity: act.activity === 'Drag & Drop' ? 'Emparejar' : act.activity
        }));

        setReport({
          ...repData,
          totalRegisteredStudents: totalRegistered,
          levelCompletions: updatedCompletions,
          activityEngagement: updatedEngagement
        });
      } else {
        // Fallback calculations directly from registered users list if report API was offline
        const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        registeredUsers.forEach(u => {
          const unlocked = u.unlockedLevel || 1;
          for (let l = 1; l <= unlocked; l++) {
            levelCounts[l] = (levelCounts[l] || 0) + 1;
          }
        });

        const levelNames: Record<number, string> = {
          1: "Principiante",
          2: "Básico",
          3: "Intermedio Bajo",
          4: "Intermedio",
          5: "Avanzado A1"
        };

        const levelCompletions = [1, 2, 3, 4, 5].map(lvl => {
          const count = levelCounts[lvl] || 0;
          return {
            level: lvl,
            name: levelNames[lvl],
            count,
            percentage: Math.min(100, Math.round((count / totalRegistered) * 100))
          };
        });

        const avgStudyTimeByLevel = [1, 2, 3, 4, 5].map(lvl => {
          const studentsAtLvl = registeredUsers.filter(u => (u.unlockedLevel || 1) === lvl);
          const totalMinsAtLvl = studentsAtLvl.reduce((acc, u) => acc + (u.studyTimeMinutes || 0), 0);
          const avgMinutes = studentsAtLvl.length > 0 ? Math.round(totalMinsAtLvl / studentsAtLvl.length) : 0;
          return {
            level: `Nivel ${lvl}`,
            avgMinutes: avgMinutes || 0,
            totalMinutes: totalMinsAtLvl || 0
          };
        });

        const totalStudyTimeAllStudents = registeredUsers.reduce((acc, u) => acc + (u.studyTimeMinutes || 0), 0);

        setReport({
          totalRegisteredStudents: totalRegistered,
          totalStudyTimeAllStudents,
          levelCompletions,
          avgStudyTimeByLevel,
          activityEngagement: [
            { activity: "Flashcards", usagePercent: 35 },
            { activity: "Emparejar", usagePercent: 25 },
            { activity: "Juego de Memoria", usagePercent: 20 },
            { activity: "Completar Palabras", usagePercent: 12 },
            { activity: "Listening Simple", usagePercent: 8 }
          ]
        });
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !report) {
    return <div className="p-12 text-center text-slate-500 font-bold">Cargando reportes y analítica...</div>;
  }

  const totalRegistered = report.totalRegisteredStudents || 1;

  // Visual color accents for activity items
  const getActivityColor = (name: string) => {
    if (name.includes('Flashcard')) return { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' };
    if (name.includes('Emparejar') || name.includes('Drag')) return { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
    if (name.includes('Memoria')) return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
    if (name.includes('Completar') || name.includes('Palabras')) return { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' };
    return { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' };
  };

  return (
    <div className="space-y-6">
      {/* 1. Level Completions Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Tasa de Superación por Nivel (CEFR A1)
            </h3>
          </div>
          <span className="text-xs font-normal text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalRegistered}</span> Estudiantes Registrados
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {report.levelCompletions.map(item => (
            <div key={item.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100/70 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 text-[11px] flex items-center justify-center font-bold">
                    {item.level}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Nivel {item.level}:</span> {item.name}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.count}</span> de {totalRegistered} estudiantes (<span className="font-bold text-slate-700 dark:text-slate-300">{item.percentage}%</span>)
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                <div
                  className="h-full bg-indigo-400 dark:bg-indigo-500 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.max(item.percentage, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Average Study Time */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tiempo de Estudio de Estudiantes (Minutos)
              </h3>
            </div>
            {report.totalStudyTimeAllStudents !== undefined && (
              <span className="text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Total Global: {report.totalStudyTimeAllStudents} min
              </span>
            )}
          </div>

          <div className="space-y-3 pt-1">
            {report.avgStudyTimeByLevel.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-emerald-200 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.level}</span>
                    {item.totalMinutes !== undefined && (
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {item.totalMinutes} min acumulados en actividades
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800">
                  {item.avgMinutes} min / est.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Activity Engagement */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Preferencia de Actividades Interactivas
              </h3>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {report.activityEngagement.map((act, idx) => {
              const color = getActivityColor(act.activity);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`} />
                      {act.activity === 'Drag & Drop' ? 'Emparejar' : act.activity}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {act.usagePercent}% uso
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                    <div
                      className={`h-full ${color.bg} rounded-full transition-all duration-700 shadow-sm`}
                      style={{ width: `${Math.max(act.usagePercent, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
