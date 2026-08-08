// Helper functions for tracking real daily words and consecutive study days streak
export interface DailyLogMap {
  [dateStr: string]: number; // "YYYY-MM-DD" => count of words learned on that date
}

export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyLogs(userId?: string): DailyLogMap {
  try {
    const key = `vocab_daily_logs_${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading daily logs:', e);
  }
  return {};
}

export function recordWordsForToday(wordsCount: number, userId?: string): DailyLogMap {
  const logs = getDailyLogs(userId);
  const todayStr = getTodayDateStr();
  logs[todayStr] = (logs[todayStr] || 0) + wordsCount;
  try {
    const key = `vocab_daily_logs_${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving daily logs:', e);
  }
  return logs;
}

export function calculateRealStreak(userId?: string): number {
  const logs = getDailyLogs(userId);
  const today = new Date();
  const todayStr = getTodayDateStr();

  let streak = 0;

  // If student studied today, streak starts at 1
  if ((logs[todayStr] || 0) > 0) {
    streak += 1;
    // Check backwards day by day from yesterday
    const checkDate = new Date(today);
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      if ((logs[dateStr] || 0) > 0) {
        streak += 1;
      } else {
        break;
      }
    }
  } else {
    // If student hasn't studied today yet, check yesterday to see current active streak
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      if ((logs[dateStr] || 0) > 0) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return streak;
}

export interface WeeklyChartItem {
  day: string;
  dateStr: string;
  words: number;
  isToday: boolean;
  target: number;
}

export function getRealWeeklyData(userId?: string, dailyTarget = 20): WeeklyChartItem[] {
  const logs = getDailyLogs(userId);
  const today = new Date();
  const todayStr = getTodayDateStr();

  // Find Monday of current week
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMon = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  const mondayDate = new Date(today);
  mondayDate.setDate(today.getDate() - distanceToMon);

  const daysLabel = [
    { name: 'Lun', offset: 0 },
    { name: 'Mar', offset: 1 },
    { name: 'Mié', offset: 2 },
    { name: 'Jue', offset: 3 },
    { name: 'Vie', offset: 4 },
    { name: 'Sáb', offset: 5 },
    { name: 'Dom', offset: 6 },
  ];

  return daysLabel.map(item => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + item.offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const words = logs[dateStr] || 0;
    const isToday = dateStr === todayStr;

    return {
      day: item.name,
      dateStr,
      words,
      isToday,
      target: dailyTarget
    };
  });
}
