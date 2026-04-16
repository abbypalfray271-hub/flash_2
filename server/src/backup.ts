import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 处理 ESM 环境下的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保备份目录存在
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 数据库路径 (相对于 server/src)
const dbPath = path.join(__dirname, '../data/guwen.db');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' + new Date().getHours() + new Date().getMinutes();
const backupPath = path.join(backupDir, `guwen-backup-${timestamp}.db`);

// 检查原数据库是否存在
if (!fs.existsSync(dbPath)) {
    console.error(`[Backup] 错误: 找不到源数据库文件 ${dbPath}`);
    process.exit(1);
}

const db = new Database(dbPath);

console.log(`[Backup] 正在将数据备份至: ${backupPath}...`);

db.backup(backupPath)
  .then(() => {
    console.log('[Backup] 备份成功完成！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Backup] 备份失败:', err);
    process.exit(1);
  });
