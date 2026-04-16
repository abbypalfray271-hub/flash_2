import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 处理 ESM 环境下的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 数据库初始化
const dbPath = path.join(__dirname, '../data/guwen.db');
const db = new Database(dbPath);

// 初始化数据表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    contact TEXT PRIMARY KEY,
    nickname TEXT,
    grade INTEGER,
    pin TEXT,
    check_in_streak INTEGER DEFAULT 0,
    last_check_in_date TEXT,
    total_check_in_days INTEGER DEFAULT 0,
    mastered_tools TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS progress (
    contact TEXT,
    poem_id TEXT,
    mastered_sentences TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contact, poem_id)
  );
`);

// 注册或更新用户 (缔结契约)
app.post('/api/register', async (req, res) => {
  const { nickname, grade, contact, pin } = req.body;
  if (!nickname || !grade || !contact || !pin) {
    return res.status(400).json({ error: '必填信息缺失' });
  }

  const hashedPin = await bcrypt.hash(pin, 10);

  try {
    const info = db.prepare(`
      INSERT INTO users (contact, nickname, grade, pin) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(contact) DO UPDATE SET 
        nickname=excluded.nickname, 
        grade=excluded.grade, 
        pin=excluded.pin
    `).run(contact, nickname, grade, hashedPin);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '保存失败' });
  }
});

// 登录 (唤醒魔法)
app.post('/api/login', async (req, res) => {
  const { contact, pin } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE contact = ?').get(contact) as any;

  if (!user) {
    return res.status(404).json({ error: '未找到契约号' });
  }

  const match = await bcrypt.compare(pin, user.pin);
  if (!match) {
    return res.status(401).json({ error: '魔法暗号错误' });
  }

  // 获取该用户的学习进度
  const progressRows = db.prepare('SELECT * FROM progress WHERE contact = ?').all(contact) as any[];
  const poemProgress: Record<string, any> = {};
  progressRows.forEach(row => {
    poemProgress[row.poem_id] = {
      masteredSentences: JSON.parse(row.mastered_sentences)
    };
  });

  res.json({
    user: {
      nickname: user.nickname,
      grade: user.grade,
      contact: user.contact,
      checkInStreak: user.check_in_streak,
      lastCheckInDate: user.last_check_in_date,
      totalCheckInDays: user.total_check_in_days,
      masteredTools: JSON.parse(user.mastered_tools)
    },
    progress: poemProgress
  });
});

// 同步进度 (静默同步)
app.post('/api/sync', (req, res) => {
  const { contact, stats, progress } = req.body;
  if (!contact) return res.status(400).json({ error: '身份不明' });

  db.transaction(() => {
    // 更新用户全局统计
    if (stats) {
      db.prepare(`
        UPDATE users SET 
          check_in_streak = ?, 
          last_check_in_date = ?, 
          total_check_in_days = ?, 
          mastered_tools = ?
        WHERE contact = ?
      `).run(
        stats.checkInStreak, 
        stats.lastCheckInDate, 
        stats.totalCheckInDays, 
        JSON.stringify(stats.masteredTools || []),
        contact
      );
    }

    // 更新各篇目进度
    if (progress) {
      const upsertProgress = db.prepare(`
        INSERT INTO progress (contact, poem_id, mastered_sentences)
        VALUES (?, ?, ?)
        ON CONFLICT(contact, poem_id) DO UPDATE SET 
          mastered_sentences = excluded.mastered_sentences,
          updated_at = CURRENT_TIMESTAMP
      `);

      for (const [poemId, data] of Object.entries(progress)) {
        upsertProgress.run(contact, poemId, JSON.stringify((data as any).masteredSentences || []));
      }
    }
  })();

  res.json({ success: true });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`魔法书后端已在端口 ${PORT} 唤醒...`);
});
