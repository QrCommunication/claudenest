import api from '@/utils/api';

export interface DashboardStats {
  machines: { total: number; online: number };
  sessions: { active: number; total_today: number };
  projects: { total: number; active: number };
  tasks: { pending: number; in_progress: number; done_today: number };
  tokens: { total: number; today: number };
  cost: { total: number; today: number };
  locks: { active: number };
  context_chunks: { total: number };
  activity_24h: number;
  sparklines: {
    activity_7d: number[];
    sessions_7d: number[];
    tokens_7d: number[];
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get('/dashboard/stats');
  return data.data;
}
