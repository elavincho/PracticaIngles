import { User, VocabularyWord, CategoryInfo, AdminStats, ReportData } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('vocab_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // System Health & DB Connection Status
  checkHealth: async (): Promise<{ status: string; dbConnected: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      return {
        status: data.status,
        dbConnected: !!data.dbConnected,
        message: data.message || 'Verificación completada'
      };
    } catch {
      return {
        status: 'offline',
        dbConnected: false,
        message: 'No hay conexión con el servidor backend.'
      };
    }
  },

  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({ message: `Error del servidor (${res.status} ${res.statusText})` }));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada o credenciales inválidas');
    if (data.token) localStorage.setItem('vocab_token', data.token);
    return data;
  },

  register: async (name: string, email: string, password: string, role = 'user') => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json().catch(() => ({ message: `Error del servidor (${res.status} ${res.statusText})` }));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada o error al registrarse');
    if (data.token) localStorage.setItem('vocab_token', data.token);
    return data;
  },

  getProfile: async (): Promise<User> => {
    const token = localStorage.getItem('vocab_token');
    if (!token) {
      throw new Error('No autorizado, token requerido');
    }
    const res = await fetch(`${API_BASE}/auth/profile`, { headers: getHeaders() });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('vocab_token');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Base de datos no conectada o sesión no autorizada');
    }
    return await res.json();
  },

  updateProfile: async (data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    phone?: string;
    bio?: string;
    address?: string;
    occupation?: string;
  }): Promise<User> => {
    const token = localStorage.getItem('vocab_token');
    if (!token) {
      throw new Error('No autorizado, token requerido');
    }
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result.message || 'Error al actualizar el perfil');
    }
    return result;
  },

  getLeaderboard: async (type: string = 'global', level: number = 1): Promise<Array<{
    id: string;
    name: string;
    email?: string;
    role: string;
    points: number;
    rank: number;
    matchedWords?: number;
    moves?: number;
    correctSentences?: number;
    correctWords?: number;
    aciertos?: number | null;
    attempts?: number | null;
  }>> => {
    try {
      const res = await fetch(`${API_BASE}/auth/leaderboard?type=${encodeURIComponent(type)}&level=${level}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Vocabulary
  getVocabulary: async (level?: number, category?: string, search?: string): Promise<VocabularyWord[]> => {
    const params = new URLSearchParams();
    if (level) params.append('level', level.toString());
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/vocab?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al cargar vocabulario');
    }
    return await res.json();
  },

  getCategories: async (): Promise<CategoryInfo[]> => {
    const res = await fetch(`${API_BASE}/vocab/categories`);
    if (!res.ok) throw new Error('Error al cargar categorías');
    return await res.json();
  },

  saveProgress: async (payload: {
    pointsEarned: number;
    levelCompleted?: number;
    categoryCompleted?: string;
    accuracy: number;
    studySeconds?: number;
    activityType?: string;
    matchedWords?: number;
    moves?: number;
    attempts?: number;
    correctSentences?: number;
    correctWords?: number;
    activeLevel?: number;
  }) => {
    const token = localStorage.getItem('vocab_token');
    if (!token) {
      throw new Error('No hay sesión activa. Por favor, inicia sesión para guardar tu progreso.');
    }

    const res = await fetch(`${API_BASE}/vocab/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      localStorage.removeItem('vocab_token');
      return { success: false, message: 'No autorizado, token requerido' };
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. El progreso no pudo ser guardado.');
    return data;
  },

  // Admin
  getAdminStats: async (): Promise<AdminStats> => {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    if (res.status === 401) localStorage.removeItem('vocab_token');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudieron obtener las estadísticas.');
    return data;
  },

  getAdminUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    if (res.status === 401) localStorage.removeItem('vocab_token');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudieron obtener los usuarios.');
    return data;
  },

  createAdminUser: async (userData: Partial<User>) => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudo crear el usuario.');
    return data;
  },

  updateAdminUser: async (id: string, userData: Partial<User>) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudo actualizar el usuario.');
    return data;
  },

  deleteAdminUser: async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudo eliminar el usuario.');
    return data;
  },

  resetAdminPassword: async (id: string, newPassword: string) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudo resetear la contraseña.');
    return data;
  },

  createWord: async (wordData: Partial<VocabularyWord>) => {
    const res = await fetch(`${API_BASE}/admin/vocab`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(wordData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudo crear la palabra.');
    return data;
  },

  updateWord: async (id: string, wordData: Partial<VocabularyWord>) => {
    const res = await fetch(`${API_BASE}/admin/vocab/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(wordData)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudo actualizar la palabra.');
    return data;
  },

  deleteWord: async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/vocab/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudo eliminar la palabra.');
    return data;
  },

  getReports: async (): Promise<ReportData> => {
    const res = await fetch(`${API_BASE}/admin/reports`, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Base de datos no conectada. No se pudieron obtener los reportes.');
    return data;
  }
};
