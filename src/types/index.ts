export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  points: number;
  streak: number;
  unlockedLevel: number;
  badges: string[];
  completedCategories: string[];
  studyTimeMinutes?: number;
  todayWordsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  address?: string;
  occupation?: string;
}

export interface VocabularyWord {
  _id?: string;
  id?: string;
  word: string;
  translation: string;
  phonetic: string;
  category: string;
  level: number;
  imageUrl: string;
  exampleSentenceEn: string;
  exampleSentenceEs: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  failCount?: number;
  successCount?: number;
}

export interface CategoryInfo {
  name: string;
  level: number;
  totalWords: number;
}

export interface AdminStats {
  totalUsers: number;
  avgProgress: number;
  totalVocab: number;
  hardestWords: { word: string; translation: string; level: number; failCount: number }[];
  activeUsersToday: number;
  levelCompletion: Record<string, number>;
}

export interface ReportData {
  totalRegisteredStudents?: number;
  totalStudyTimeAllStudents?: number;
  levelCompletions: { level: number; name: string; count: number; percentage: number }[];
  avgStudyTimeByLevel: { level: string; avgMinutes: number; totalMinutes?: number }[];
  activityEngagement: { activity: string; usagePercent: number }[];
}

export type ActivityType = 'flashcards' | 'dragdrop' | 'memory' | 'fillblanks' | 'listening';
