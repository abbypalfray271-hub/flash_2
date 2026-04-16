# 第一阶段：编译环境 (Build Stage)
FROM node:20-alpine AS build
WORKDIR /app

# 优先安装依赖，利用 Docker 缓存层
COPY package*.json ./
RUN npm install

# 复制源码并构建
COPY . .
RUN npm run build

# 第二阶段：生产运行 (Serve Stage)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
