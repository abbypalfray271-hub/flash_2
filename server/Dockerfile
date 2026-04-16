# 第一阶段：构建环境 (Deps & Build)
FROM node:20-alpine AS builder

WORKDIR /app

# 1. 只有这一行是重活，安装编译所需的底层工具（固定在最顶层，永久缓存）
RUN apk add --no-cache python3 make g++

# 2. 安装依赖
COPY package*.json ./
RUN npm install

# 3. 编译 TypeScript
COPY . .
RUN npx tsc

# 第二阶段：运行环境 (Production)
FROM node:20-alpine

WORKDIR /app

# 只要编译出的代码和运行时依赖，剔除 gcc/python 等重型工具
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3005

# 持久化数据卷
VOLUME ["/app/data"]

CMD ["node", "dist/index.js"]
