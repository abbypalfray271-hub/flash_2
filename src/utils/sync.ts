import type { UserStats, Progress } from '../types';
import { getUserStats, getAllProgress, saveUserStats, savePoemProgress } from './storage';

// 阿里云部署后的后端地址 (默认同域名下的 3005 端口，或通过 Nginx 反代)
const API_BASE = '/api'; 

export async function syncRegister(stats: UserStats): Promise<boolean> {
  try {
    // 3秒超时，防止无后端时无限挂起
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: stats.nickname,
        grade: stats.grade,
        contact: stats.contact,
        pin: stats.pin
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) {
    console.error('Cloud register failed', e);
    return false;
  }
}

export async function syncLogin(contact: string, pin: string): Promise<{stats: UserStats, progress: Record<string, Progress>} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, pin }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      stats: data.user,
      progress: data.progress
    };
  } catch (e) {
    console.error('Cloud login failed', e);
    return null;
  }
}

export async function pushSync(): Promise<void> {
  const stats = getUserStats();
  const progress = getAllProgress();
  
  if (!stats.contact) return; // 未注册

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: stats.contact,
        stats,
        progress
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (e) {
    console.warn('Silent sync failed, will retry later.', e);
  }
}

/**
 * 完整拉取并覆盖本地 (用于登录后)
 */
export function applyCloudData(stats: UserStats, progress: Record<string, Progress>) {
  saveUserStats(stats);
  for (const [poemId, p] of Object.entries(progress)) {
    savePoemProgress({ ...p, poemId });
  }
}
