/**
 * 篇目基础信息
 */
export interface Poem {
  id: string;                    // 如 "grade3-shouzhutu"
  title: string;                 // "守株待兔"
  author: string;                // "韩非"
  dynasty: string;               // "战国"
  source: string;                // "《韩非子》"
  grade: 1 | 2 | 3 | 4 | 5 | 6;         // 年级
  semester: 1 | 2;              // 学期 (1: 上, 2: 下)
  category: 'prose' | 'poetry'; // 分类 (prose: 文言文, poetry: 古诗词)
  sentences: Sentence[];
  keywords?: Keyword[];          // 重点字词标注
  audioFile: string;             // "audio/守株待兔.mp3"
  isCustom?: boolean;            // 是否为自建/修改过的
}

/**
 * 重点字词标注
 */
export interface Keyword {
  word: string;                  // 关键词
  pinyin?: string;               // 读音
  meaning: string;               // 释义
  context?: string;              // 上下文原句
}

/**
 * 句子详细内容
 */
export interface Sentence {
  id: number;                   // 句序号 (1-indexed)
  text: string;                 // 原文
  translation: string;          // 白话译文
  audioFile?: string;           // 该句对应的独立音频路径 (可选)
}

/**
 * 用户学习进度
 */
export interface Progress {
  poemId: string;
  masteredSentences: number[];   // 已标记为“记住了”的句子 ID 列表
  lastStudyTime: number;         // 最后学习时间戳
  chainAccuracy: number;         // 上一次接龙挑战的正确率 (0-1)
}

/**
 * 应用路由状态
 */
export type AppView = 'home' | 'flashcard' | 'chain' | 'add' | 'edit';

export interface AppState {
  view: AppView;
  currentPoemId?: string;
}

/**
 * 全局用户统计
 */
export interface UserStats {
  nickname: string;              // 雅号 (姓名)
  grade: number;                 // 年级 (1-6)
  contact: string;               // 契约号 (手机/微信)
  pin: string;                   // 魔法暗号 (4位数字)
  checkInStreak: number;         // 连续打卡天数
  lastCheckInDate: string;       // 最后打卡日期 (YYYY-MM-DD)
  totalCheckInDays: number;      // 累计打卡天数
  masteredTools: string[];       // 已获得的文房四宝 ["笔", "墨", "纸", "砚"]
}
