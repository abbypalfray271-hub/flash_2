import type { Progress, Poem, UserStats } from '../types';
import { pushSync } from './sync';

const PROGRESS_KEY = 'guwen_flashback_progress';
const CUSTOM_LIST_KEY = 'guwen_flashback_custom_list';
const OVERRIDES_KEY = 'guwen_flashback_overrides';
const USER_STATS_KEY = 'guwen_flashback_user_stats';

/**
 * --- 进度管理 ---
 */
export function getAllProgress(): Record<string, Progress> {
  const data = localStorage.getItem(PROGRESS_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

export function getPoemProgress(poemId: string): Progress {
  const all = getAllProgress();
  return all[poemId] || {
    poemId,
    masteredSentences: [],
    lastStudyTime: 0,
    chainAccuracy: 0
  };
}

export function savePoemProgress(progress: Progress): void {
  const all = getAllProgress();
  all[progress.poemId] = { ...progress, lastStudyTime: Date.now() };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  pushSync(); // 触发静默同步
}

export function markSentenceMastered(poemId: string, sentenceId: number): void {
  const progress = getPoemProgress(poemId);
  if (!progress.masteredSentences.includes(sentenceId)) {
    progress.masteredSentences.push(sentenceId);
    savePoemProgress(progress);
  }
}

/**
 * --- 自定义内容管理 ---
 */
export function getCustomPoems(): Poem[] {
  const data = localStorage.getItem(CUSTOM_LIST_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveCustomPoem(poem: Poem) {
  const list = getCustomPoems();
  const index = list.findIndex(p => p.id === poem.id);
  const newPoem = { ...poem, isCustom: true };
  
  if (index >= 0) {
    list[index] = newPoem;
  } else {
    list.push(newPoem);
  }
  localStorage.setItem(CUSTOM_LIST_KEY, JSON.stringify(list));
  pushSync();
}

export function deleteCustomPoem(poemId: string) {
  // 1. 从列表删除
  const list = getCustomPoems().filter(p => p.id !== poemId);
  localStorage.setItem(CUSTOM_LIST_KEY, JSON.stringify(list));
  
  // 2. 从重写版删除
  const overrides = getAllOverrides();
  delete overrides[poemId];
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  
  // 3. 删除进度
  const progress = getAllProgress();
  delete progress[poemId];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  pushSync();
}

/**
 * --- 重写逻辑 (针对内置篇目的微调) ---
 */
export function getAllOverrides(): Record<string, Poem> {
  const data = localStorage.getItem(OVERRIDES_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

export function savePoemOverride(poem: Poem) {
  const all = getAllOverrides();
  all[poem.id] = { ...poem, isCustom: true };
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
}

/**
 * --- 备份与恢复 ---
 */
export function exportBackup() {
  const backup = {
    progress: getAllProgress(),
    customList: getCustomPoems(),
    overrides: getAllOverrides(),
    userStats: getUserStats(),
    version: '1.1',
    exportTime: Date.now()
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guwen_flashback_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.progress) localStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress));
    if (data.customList) localStorage.setItem(CUSTOM_LIST_KEY, JSON.stringify(data.customList));
    if (data.overrides) localStorage.setItem(OVERRIDES_KEY, JSON.stringify(data.overrides));
    if (data.userStats) localStorage.setItem(USER_STATS_KEY, JSON.stringify(data.userStats));
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}

/**
 * --- 用户统计信息 (打卡等) ---
 */
export function getUserStats(): UserStats {
  const data = localStorage.getItem(USER_STATS_KEY);
  const defaultStats: UserStats = {
    nickname: '',
    grade: 0,
    contact: '',
    pin: '',
    checkInStreak: 0,
    lastCheckInDate: '',
    totalCheckInDays: 0,
    masteredTools: [] // 旅行者成就：风神瞳, 原石, 纠缠之缘, 神之眼
  };
  
  if (!data) return defaultStats;
  try {
    return { ...defaultStats, ...JSON.parse(data) };
  } catch (e) {
    return defaultStats;
  }
}

export function saveUserStats(stats: UserStats): void {
  localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
  pushSync();
}
