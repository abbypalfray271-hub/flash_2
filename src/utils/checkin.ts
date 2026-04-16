import { getUserStats, saveUserStats } from './storage';

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayStr(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * 获取昨天的日期字符串
 */
export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * 执行打卡动作
 * @returns { success: boolean, streak: number, isNewTool: string | null }
 */
export function performCheckIn(): { success: boolean, streak: number, newTool: string | null } {
  const stats = getUserStats();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  // 1. 检查今天是否已打卡
  if (stats.lastCheckInDate === today) {
    return { success: false, streak: stats.checkInStreak, newTool: null };
  }

  // 2. 更新连续天数
  if (stats.lastCheckInDate === yesterday) {
    stats.checkInStreak += 1;
  } else {
    stats.checkInStreak = 1;
  }

  // 3. 更新日期与总天数
  stats.lastCheckInDate = today;
  stats.totalCheckInDays += 1;

  // 4. 奖励提瓦特物品 (风神瞳:3天, 原石:7天, 纠缠之缘:15天, 神之眼:30天)
  let newTool: string | null = null;
  const tools = ['风神瞳', '原石', '纠缠之缘', '神之眼'];
  const thresholds = [3, 7, 15, 30];
  
  thresholds.forEach((t, i) => {
    const tool = tools[i];
    if (stats.checkInStreak >= t && !stats.masteredTools.includes(tool)) {
      stats.masteredTools.push(tool);
      newTool = tool;
    }
  });

  saveUserStats(stats);
  return { success: true, streak: stats.checkInStreak, newTool };
}

/**
 * 随机获取一句金句作为日签内容
 */
export function getRandomQuote(poems: any[]): { text: string, title: string, author: string } {
  const allSentences: any[] = [];
  poems.forEach(p => {
    p.sentences.forEach((s: any) => {
      if (s.text.length > 5 && s.text.length < 20) {
        allSentences.push({ text: s.text, title: p.title, author: p.author });
      }
    });
  });

  const randomIndex = Math.floor(Math.random() * allSentences.length);
  return allSentences[randomIndex] || { text: '读书百遍，其义自见。', title: '古语', author: '佚名' };
}
