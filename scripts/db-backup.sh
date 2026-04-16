#!/bin/bash

# 获取脚本绝对路径
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/.."

echo "[Cron] $(date) - 开始执行数据库定时备份计划..."

# 运行备份命令 (需配合后续在 package.json 中添加的 backup 指令)
# 注意：在生产环境下，如果是在 Docker 外部执行，需要确保环境已安装 node
cd "$PROJECT_ROOT/server" && npm run backup

# 滚动清理：删除 7 天前的所有以 .db 结尾的备份文件
BACKUP_DIR="$PROJECT_ROOT/server/backups"

if [ -d "$BACKUP_DIR" ]; then
    echo "[Cron] 正在清理超过 7 天的旧记录..."
    find "$BACKUP_DIR" -name "*.db" -mtime +7 -exec rm -f {} \;
    echo "[Cron] 清理完成。"
else
    echo "[Cron] 错误: 找不到备份目录 $BACKUP_DIR"
fi

echo "[Cron] 任务结束。"
