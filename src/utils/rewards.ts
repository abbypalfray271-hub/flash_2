export interface Reward {
  type: 'GOLD' | 'PURPLE' | 'BLUE';
  icon: string;
  name: string;
  quote: string;
  character: string;
}

const REWARDS: Reward[] = [
  {
    type: 'GOLD',
    icon: '💫',
    name: '纠缠之缘',
    quote: '契约已成，这份记忆如同磐石般无懈可击。',
    character: '钟离'
  },
  {
    type: 'GOLD',
    icon: '💎',
    name: '原石 x160',
    quote: '以此为记，永恒之道亦不远矣。',
    character: '雷电将军'
  },
  {
    type: 'PURPLE',
    icon: '🌙',
    name: '脆弱树脂',
    quote: '知识与你同在，智慧的火花在言语间闪耀。',
    character: '纳西妲'
  },
  {
    type: 'PURPLE',
    icon: '📕',
    name: '大英雄的经验',
    quote: '优秀的剑豪，不仅要懂得挥剑，更要懂得铭记。',
    character: '神里绫华'
  },
  {
    type: 'BLUE',
    icon: '🍗',
    name: '甜甜花酿鸡',
    quote: '旅行者快吃吧！吃饱了才有力气背下一篇哦！',
    character: '派蒙'
  },
  {
    type: 'BLUE',
    icon: '💰',
    name: '摩拉 x20000',
    quote: '有钱好办事，有才好正名。继续努力吧！',
    character: '凝光'
  },
  {
    type: 'BLUE',
    icon: '🍳',
    name: '提瓦特煎蛋',
    quote: '即便暂时遗忘，也要有重新站起来的勇气。',
    character: '班尼特'
  }
];

export function getRandomReward(accuracy: number): Reward {
  let pool: Reward[];
  if (accuracy >= 100) {
    pool = REWARDS.filter(r => r.type === 'GOLD');
  } else if (accuracy >= 70) {
    pool = REWARDS.filter(r => r.type === 'PURPLE');
  } else {
    pool = REWARDS.filter(r => r.type === 'BLUE');
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
}
