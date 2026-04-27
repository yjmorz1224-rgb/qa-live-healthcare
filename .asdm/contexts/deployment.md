# 部署配置文档 (Deployment Guide)

> **项目**: qa-live-healthcare（在线医疗问询平台）
> **生成时间**: 2026-04-27
> **适用阶段**: MVP / 开发环境 / 静态托管

---

## 目录

- [1. 部署概览](#1-部署概览)
- [2. 环境要求](#2-环境要求)
- [3. 本地开发环境搭建](#3-本地开发环境搭建)
- [4. 生产构建流程](#4-生产构建流程)
- [5. 部署方案](#5-部署方案)
  - [5.1 Nginx 静态部署（推荐）](#51-nginx-静态部署推荐)
  - [5.2 Vercel / Netlify 部署](#52-vercel--netlify-部署)
  - [5.3 GitHub Pages 部署](#53-github-pages-部署)
  - [5.4 Docker 容器化部署](#54-docker-容器化部署)
- [6. 域名与 HTTPS](#6-域名与-https)
- [7. 环境变量管理](#7-环境变量管理)
- [8. 性能优化建议](#8-性能优化建议)
- [9. 监控与日志](#9-监控与日志)
- [10. CI/CD 流水线示例](#10-cicd-流水线示例)
- [11. 故障排查指南](#11-故障排查指南)

---

## 1. 部署概览

### 应用类型

| 属性 | 值 |
|------|-----|
| **应用类型** | 单页应用 (SPA) |
| **构建输出** | 静态文件（HTML/CSS/JS/资源） |
| **服务端依赖** | 无（纯前端） |
| **数据存储** | 本地 JSON 文件（当前阶段） |
| **路由模式** | HTML5 History Mode（需服务端 fallback） |

### 部署架构图

```mermaid
graph TB
    subgraph 开发环境 DEV["开发环境"]
        D1[开发者机器]
        D2[Vite Dev Server :5173]
        D3[Hot Module Replacement]
        D1 --> D2
        D2 --> D3
    end

    subgraph 构建阶段 BUILD["构建阶段"]
        B1[Vite Build]
        B2[dist/ 目录]
        B3[代码分割 + 压缩]
        B1 --> B3
        B3 --> B2
    end

    subgraph 生产环境 PROD["生产环境"]
        P1[Nginx / CDN]
        P2[静态文件服务]
        P3[History Fallback]
        P4[HTTPS + gzip]
        P1 --> P2
        P2 --> P3
        P1 --> P4
    end

    D2 -- npm run build --> B1
    B2 -- 部署 dist/ --> P1
    
    USER[浏览器] --> P1
    P1 --> USER
```

---

## 2. 环境要求

### 开发环境

| 工具 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | >= 18.0.0 | >= 20.x LTS |
| npm | >= 9.0.0 | >= 10.x |
| 操作系统 | Windows/macOS/Linux | - |

### 浏览器支持

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | >= 90 |
| Firefox | >= 88 |
| Safari | >= 14 |
| Edge | >= 90 |

### 生产服务器要求（Nginx 方案）

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 1 核 | 2 核+ |
| 内存 | 512 MB | 1 GB+ |
| 磁盘空间 | 100 MB（含 dist/） | 500 MB+ |
| 操作系统 | Ubuntu 20.04+ / CentOS 8+ | - |
| Web 服务器 | Nginx >= 1.18 | Nginx >= 1.22 |

---

## 3. 本地开发环境搭建

### 3.1 初始化步骤

```bash
# 1. 克隆代码仓库
git clone <repository-url>
cd qa-live-healthcare

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 3.2 开发命令速查

```bash
# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建结果
npm run preview
```

### 3.3 开发端口配置

当前默认端口为 `5173`（Vite 默认）。如需修改，在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  server: {
    port: 3000,       // 自定义端口
    open: true,       // 自动打开浏览器
    host: true        // 允许局域网访问
  }
})
```

---

## 4. 生产构建流程

### 4.1 构建步骤

```bash
# 执行生产构建
npm run build
```

### 4.2 构建产物说明

执行 `npm run build` 后，在项目根目录生成 `dist/` 目录：

```
dist/
├── index.html              # 入口 HTML（已注入资源链接）
├── assets/
│   ├── index-[hash].js     # 主 JavaScript bundle（含 Vue + 业务代码）
│   ├── index-[hash].css    # 主样式表（Ant Design + 自定义样式）
│   └── vendor-[hash].js    # 第三方库 chunk（如有代码分割）
└── [其他静态资源]          # public/ 目录下的静态文件复制
```

### 4.3 构建产物大小参考

| 文件类型 | 大小范围（gzip 后） | 说明 |
|----------|---------------------|------|
| JS Bundle | ~150-300 KB | 含 Vue 3 + Ant Design Vue |
| CSS | ~80-200 KB | Ant Design 组件样式 + 自定义样式 |
| HTML | ~2-5 KB | 入口文件 |
| **总计** | ~250-500 KB | 首屏加载 |

### 4.4 Vite 构建配置详情

当前 `vite.config.ts` 配置解析：

```typescript
// 当前配置（来自 vite.config.ts）
export default defineConfig({
  plugins: [vue()],           // Vue 3 SFC 编译插件
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))  // @ → src/ 别名
    }
  },
  // 未显式设置以下选项（使用 Vite 默认值）:
  // - build.outDir: 'dist'         ← 输出目录
  // - build.assetsDir: 'assets'    ← 静态资源子目录
  // - css.codeSplit: true          ← CSS 代码分割
  // - build.minify: 'esbuild'      ← 压缩器
  // - build.sourcemap: false       ← 不生成 sourcemap（生产）
})
```

---

## 5. 部署方案

### 5.1 Nginx 静态部署（推荐）

适用于：自有服务器、云主机（腾讯云 CVM、阿里云 ECS 等）

#### 5.1.1 上传构建产物

```bash
# 方式一：scp 直接上传
scp -r dist/* user@your-server:/var/www/qa-live-healthcare/

# 方式二：打包后上传
tar -czf dist.tar.gz dist/
scp dist.tar.gz user@your-server:/tmp/
# 在服务器上：
ssh user@your-server
cd /var/www && mkdir -p qa-live-healthcare && cd qa-live-healthcare && tar -xzf /tmp/dist.tar.gz
```

#### 5.1.2 Nginx 配置

创建 `/etc/nginx/sites-available/qa-live-healthcare`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # 网站根目录指向 dist/
    root /var/www/qa-live-healthcare;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        image/svg+xml;

    # 静态资源缓存（带 hash 的文件可长期缓存）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API 代理预留（未来接后端时使用）
    # location /api/ {
    #     proxy_pass http://localhost:8080/;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    # }

    # SPA History Mode 关键配置
    # 所有未匹配的路径都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

#### 5.1.3 启用站点

```bash
# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/qa-live-healthcare /etc/nginx/sites-enabled/

# 测试配置语法
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

#### 5.1.4 HTTPS 配置（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 自动获取并配置 SSL 证书
sudo certbot --nginx -d your-domain.com

# Certbot 会自动：
# 1. 获取 SSL 证书
# 2. 修改 Nginx 配置添加 SSL 参数
# 3. 设置自动 HTTP→HTTPS 重定向
```

---

### 5.2 Vercel / Netlify 部署

适用于：无服务器需求、快速上线、免费额度

#### 5.2.1 Vercel 部署

**方式一：CLI 部署**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel
# 按提示选择：
# - Set up and deploy? → Y
# - Which scope? → 选择你的团队/个人
# - Link to existing project? → N（首次）
# - Project name: qa-live-healthcare
# - Directory: ./
# - Settings: 默认即可（Vercel 自动检测 Vite）
```

**方式二：vercel.json 配置**

在项目根目录创建 `vercel.json`：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

#### 5.2.2 Netlify 部署

在项目根目录创建 `netlify.toml`：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

然后通过 Netlify Dashboard 或 Git 推送触发部署。

---

### 5.3 GitHub Pages 部署

适用于：开源项目、个人展示

**注意**：GitHub Pages 不完美支持 SPA History Mode，需要改用 Hash Router。

#### 5.3.1 修改路由模式（如使用 GH Pages）

```typescript
// src/router/index.ts
// 将 createWebHistory 改为 createWebHashMemory
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),  // 使用 Memory 模式（或 Hash 模式）
  routes
})
```

#### 5.3.2 GitHub Actions 自动部署

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ github.event.repository.html_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### 5.4 Docker 容器化部署

适用于：标准化交付、Kubernetes 编排、微服务架构过渡

#### 5.4.1 Dockerfile

在项目根目录创建 `Dockerfile`：

```dockerfile
# === 构建阶段 ===
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖定义文件
COPY package*.json ./

# 安装依赖（利用 Docker 缓存层）
RUN npm ci

# 复制源码
COPY . .

# 执行构建
RUN npm run build

# === 运行阶段 ===
FROM nginx:alpine AS runner

# 移除 Nginx 默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从 builder 阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 5.4.2 Nginx 配置（Docker 内嵌版）

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 5.4.3 docker-compose.yml

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### 5.4.4 构建与运行

```bash
# 构建 Docker 镜像
docker build -t qa-live-healthcare .

# 运行容器
docker run -d -p 8080:80 --name healthcare-app qa-live-healthcare

# 或使用 docker-compose
docker-compose up -d

# 访问 http://localhost:8080
```

---

## 6. 域名与 HTTPS

### 6.1 域名配置要点

| 项目 | 建议 |
|------|------|
| **域名类型** | `.com` / `.cn` / `.health` |
| **子域名** | `app.yourdomain.com` 或 `health.yourdomain.com` |
| **DNS 解析** | A 记录指向服务器 IP，或 CNAME 指向 CDN |
| **CDN 推荐** | 腾讯云 EdgeOne / Cloudflare / 阿里云 CDN |

### 6.2 HTTPS 必要性

本项目涉及医疗健康咨询场景，**强烈建议启用 HTTPS**：
- 用户输入姓名、生日等个人信息
- 医生登录凭证传输
- 未来接入真实后端 API 时必需

### 6.3 SSL 证书方案对比

| 方案 | 成本 | 适用场景 |
|------|------|----------|
| Let's Encrypt | 免费 | 个人项目、小型应用 |
| 云服务商证书 | 免费/低价 | 已使用对应云平台 |
| 商业证书（DV/OV/EV） | 数百~数千元/年 | 正式商业产品 |

---

## 7. 环境变量管理

### 7.1 当前状态

**当前项目未使用任何环境变量**。所有配置均为硬编码或使用默认值。

### 7.2 预留环境变量（扩展用）

当项目引入后端 API 时，建议添加以下环境变量：

#### 创建 `.env.development`

```env
# 开发环境变量
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=在线医疗问诊平台(开发)
VITE_ENABLE_MOCK=true
```

#### 创建 `.env.production`

```env
# 生产环境变量
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=在线医疗问诊平台
VITE_ENABLE_MOCK=false
```

#### 在代码中使用

```typescript
// src/utils/config.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  appTitle: import.meta.env.VITE_APP_TITLE || '在线医疗问诊平台',
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true'
}
```

### 7.3 环境变量命名规范

| 规则 | 说明 |
|------|------|
| **前缀** | 所有 Vite 环境变量必须以 `VITE_` 开头才能暴露给客户端代码 |
| **命名风格** | UPPER_SNAKE_CASE |
| **敏感信息** | 密钥/密码等绝不能以 `VITE_` 前缀暴露到前端（应在服务端代理中使用） |

---

## 8. 性能优化建议

### 8.1 当前性能基线

| 指标 | 当前值 | 目标值 | 优先级 |
|------|--------|--------|--------|
| **首屏加载时间 (FCP)** | ~1-2s (本地) | < 1.5s | 高 |
| **JS Bundle 大小** | ~200-400 KB (gzip) | < 200 KB | 中 |
| **Lighthouse Performance** | 估计 70-80 | > 90 | 中 |

### 8.2 优化清单

#### P0 — 必须实施

| 优化项 | 方法 | 预期收益 |
|--------|------|----------|
| **Gzip/Brotli 压缩** | Nginx 配置开启 | 体积减少 60-70% |
| **静态资源缓存** | assets/ 设置 long-cache | 回访加载 < 1s |

#### P1 — 强烈推荐

| 优化项 | 方法 | 预期收益 |
|--------|------|----------|
| **按需导入 Ant Design** | 替换全量导入为 `unplugin-vue-components` | JS 减少 40-50% |
| **路由懒加载** | 使用 `() => import()` 动态导入 | 首次加载体积减小 |
| **图片优化** | WebP 格式 + 响应式图片 | 加载速度提升 30%+ |

##### Ant Design Vue 按需导入示例

```typescript
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [AntDesignVueResolver({ importStyle: false })]
    })
  ]
})
```

##### 路由懒加载示例

```typescript
// src/router/index.ts
const routes: RouteRecordRaw[] = {
  path: '/',
  component: () => import('@/views/Home.vue')       // 懒加载
  // ... 其他路由同样处理
}
```

#### P2 — 可选优化

| 优化项 | 说明 |
|--------|------|
| **CDN 分发** | 使用 EdgeOne/Cloudflare 加速全球访问 |
| **预加载关键资源** | `<link rel="preload">` 预加载首屏字体/图片 |
| **Service Worker** | 引入 PWA 支持离线访问（适合移动端） |
| **Bundle 分析** | 使用 `rollup-plugin-visualizer` 分析并精简依赖 |

---

## 9. 监控与日志

### 9.1 前端监控方案（推荐）

由于当前项目为纯前端 SPA，建议集成以下监控：

| 监控维度 | 工具 | 用途 |
|----------|------|------|
| **性能监控** | Google Web Vitals / Sentry | LCP/FID/CLS 指标采集 |
| **错误追踪** | Sentry | JS 运行时错误自动捕获上报 |
| **用户行为** | 百度统计 / 友盟+ | PV/UV/页面停留时间 |
| **可用性监控** | UptimeRobot / 阿里云云监控 | 站点可用性检测 |

### 9.2 Sentry 集成示例

```bash
npm install @sentry/vue
```

```typescript
// src/main.ts
import * as Sentry from '@sentry/vue'

Sentry.init({
  app,
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  release: '1.0.0',
})
```

---

## 10. CI/CD 流水线示例

### 10.1 GitHub Actions 完整流水线

创建 `.github/workflows/ci-cd.yml`：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # === Job 1: 代码质量检查 ===
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - run: npm ci
      - run: npm run build  # 构建检查（隐含类型检查）

  # === Job 2: 部署到生产环境 ===
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: lint-and-test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "dist/"
          target: "/var/www/qa-live-healthcare"
          strip_components: 1
      
      - name: Reload Nginx
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: sudo systemctl reload nginx

  # === Job 3: 部署到测试环境 ===
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: lint-and-test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to staging
        uses: peaceiris/actions-gh-pages@v3
        with:
          personal_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

### 10.2 Secrets 配置清单

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中配置：

| Secret 名称 | 说明 | 示例 |
|-------------|------|------|
| `SERVER_HOST` | 服务器 IP 或域名 | `123.456.789.0` |
| `SERVER_USER` | SSH 用户名 | `www-data` |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

---

## 11. 故障排查指南

### 11.1 常见问题速查表

| 问题现象 | 可能原因 | 解决方法 |
|----------|----------|----------|
| **刷新页面 404** | Nginx 未配置 History Mode fallback | 添加 `try_files $uri $uri/ /index.html;` |
| **空白页 / 白屏** | JS 加载失败 / 路径问题 | 检查浏览器 Console 错误，确认 base path |
| **样式丢失** | CSS 资源路径不正确 | 确认 Nginx root 路径指向 dist/ 目录 |
| **API 请求跨域** | 前后端域名不同 | 配置 CORS 或 Nginx 反向代理 |
| **字体/图标显示异常** | Ant Design 资源加载失败 | 检查网络连接或更换 CDN |
| **构建报错内存不足** | Node 内存限制 | 增加 `NODE_OPTIONS=--max-old-space-size=4096` |

### 11.2 问题诊断流程图

```mermaid
graph TD
    A[用户报告问题] --> B{问题类型?}

    B -->|页面无法访问| C{HTTP 状态码?}
    C -->|404| D[检查 Nginx try_files 配置]
    C -->|500/502| E[检查 Nginx 日志<br/>tail -f /var/log/nginx/error.log]
    C -->|连接拒绝| F[确认 Nginx 服务运行中<br/>systemctl status nginx]

    B -->|页面白屏| G{Console 报错?}
    G -->|资源 404| H[检查 base 路径和资源路径匹配]
    G -->|JS 语法错误| I[运行 npm run build 检查编译]
    G -->|无报错| J[检查 Vue Router 路由配置]

    B -->|功能异常| K{具体症状?}
    K -->|Store 数据异常| L[检查 JSON 数据源格式和路径]
    K -->|样式错乱| M[检查 scoped CSS 和 Ant Design 版本兼容]

    D --> N[修复后重载 Nginx]
    E --> O[查看详细日志定位原因]
    F --> P[启动 Nginx 服务]
    H --> Q[调整 vite.config.ts 的 base 选项]
```

### 11.3 有用的诊断命令

```bash
# 查看 Nginx 访问日志（实时）
tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 测试 Nginx 配置
sudo nginx -t

# 重载 Nginx 配置
sudo systemctl reload nginx

# 检查端口占用
netstat -tlnp | grep :80
# 或
ss -tlnp | grep :80

# curl 模拟请求测试
curl -I http://localhost
curl -I https://your-domain.com

# 检查 dist/ 内容是否完整
ls -la dist/
ls -la dist/assets/

# 检查 Nginx 进程
ps aux | grep nginx

# 检查磁盘空间
df -h
```

---

## 附录 A：部署检查清单

### 部署前检查

- [ ] `npm run build` 构建成功，无错误和警告
- [ ] `dist/index.html` 存在且包含正确的资源引用路径
- [ ] `dist/assets/` 下包含完整的 JS/CSS 资源文件
- [ ] `npm run preview` 本地预览正常
- [ ] 确认目标服务器的 Node.js/npm 版本符合要求
- [ ] 准备好域名和 DNS 解析（如使用域名访问）

### 部署后验证

- [ ] 通过浏览器可以访问首页
- [ ] 点击各导航链接，页面正常跳转
- [ ] 刷新页面不会出现 404
- [ ] 患者咨询流程完整可用（身份验证→提交问题）
- [ ] 医生登录流程完整可用（登录→诊室→回复问题）
- [ ] 浏览器 Console 无红色错误信息
- [ ] Network 面板无 404/5xx 资源加载失败
- [ ] 移动端访问布局适配正常（< 768px）

---

## 附录 B：相关文档索引

| 文档 | 路径 | 内容 |
|------|------|------|
| 工作区索引 | [.asdm/contexts/index.md](index.md) | 项目总览与业务逻辑 |
| 数据模型 | [.asdm/contexts/data-models.md](data-models.md) | 完整数据模型文档 |
| 项目结构 | [.asdm/contexts/standard-project-structure.md](standard-project-structure.md) | 标准化项目结构详解 |
| 代码风格 | [.asdm/contexts/standard-coding-style.md](standard-coding-style.md) | 编码规范与风格指南 |
| API 文档 | [.asdm/contexts/api.md](api.md) | Store API 与接口规范 |
| 系统架构 | [.asdm/contexts/architecture.md](architecture.md) | 架构设计与决策记录 |
| **部署配置** | [.asdm/contexts/deployment.md](deployment.md) | **本文档** |

---

> **文档维护说明**：本文档基于项目当前状态生成。随着技术栈演进（如引入后端、CI/CD、容器化），请及时更新相应章节。
