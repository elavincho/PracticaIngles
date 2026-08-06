import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ReportData } from '../../types';
import { BarChart3, Clock, Flame, Award, PieChart, TrendingUp } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    api.getReports().then(setReport).catch(console.error);
  }, []);

  if (!report) return <div className="p-8 text-center text-slate-500">Cargando reportes...</div>;

  return (
    <div className="space-y-6">
      {/* 1. Level Completions Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tasa de Superación por Nivel (CEFR A1)
          </h3>
        </div>

        <div className="space-y-3">
          {report.levelCompletions.map(item => (
            <div key={item.level} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Nivel {item.level}: {item.name}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{item.count} estudiantes ({item.percentage}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Average Study Time */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tiempo de Estudio de Estudiantes (Minutos)
              </h3>
            </div>
            {report.totalStudyTimeAllStudents !== undefined && (
              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Total Global: {report.totalStudyTimeAllStudents} min
              </span>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {report.avgStudyTimeByLevel.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.level}</span>
                <div className="flex items-center space-x-2">
                  {item.totalMinutes !== undefined && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      ({item.totalMinutes} min acumulados)
                    </span>
                  )}
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
                    {item.avgMinutes} min / est.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Activity Engagement */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Preferencia de Actividades Interactivas
            </h3>
          </div>
          <div className="space-y-3 pt-2">
            {report.activityEngagement.map((act, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{act.activity}</span>
                  <span className="font-bold">{act.usagePercent}% uso</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${act.usagePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
