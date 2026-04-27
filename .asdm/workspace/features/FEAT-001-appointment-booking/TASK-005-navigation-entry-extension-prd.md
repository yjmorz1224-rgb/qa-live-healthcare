# Task PRD: 扩展导航入口 — AppHeader + Home

**Feature ID**: FEAT-001
**Feature Name**: appointment-booking
**Task ID**: TASK-005
**Created Date**: 2026-04-27
**Status**: TODO
**Language**: zh-CN

## 1. 任务概述

### 1.1 任务摘要
在全局导航栏 (AppHeader.vue) 增加「挂号」菜单项，在首页 (Home.vue) Hero 区域增加「预约挂号」按钮并在统计卡片区增加预约总数卡片。提供用户进入预约功能的多个入口。

### 1.2 任务目标
- AppHeader.vue 导航菜单新增「挂号」项（位于「问诊」和「医生」之间）
- Home.vue Hero actions 新增「预约挂号」按钮
- Home.vue 统计卡片区域新增第 5 张卡片（预约总数）
- 所有新入口正确导航至 `/appointment`
- 导航高亮状态正确关联

### 1.3 关联的功能需求
- **Feature Requirement**: REQ-004（导航集成部分）
- **Related User Story**: 故事 5（首页展示预约入口）

## 2. 详细需求

### 2.1 功能需求

**AppHeader.vue 改动**：
1. 引入 `CalendarOutlined` 图标
2. 在 `<a-menu>` 中插入新的 `<a-menu-item key="appointment">`
3. watch 路由变化中增加 `/appointment` 分支处理 selectedKeys

**Home.vue 改动**：
1. Hero 区域 `.hero-actions` 新增第三个按钮：「预约挂号」（default 样式或 ghost primary 样式以区别于主 CTA）
2. 引入 `CalendarOutlined` 图标
3. statistics 区域新增第 5 张 stat-card：
   - 图标：CalendarOutlined
   - 数值：`statistics.totalAppointments`（来自更新后的 getStatistics）
   - 标签：「预约总数」
   - 配色：新的渐变色（建议金色系 #faad14 或粉色系 #eb2f96）
4. grid 布局从 4 列适配为 5 列（auto-fit 会自动处理，但需确认视觉效果）

### 2.2 技术需求
- 修改文件：`src/components/AppHeader.vue`, `src/views/Home.vue`
- 最小改动原则：仅在必要位置追加代码

### 2.3 约束与限制
- 不破坏现有导航项的顺序和高亮逻辑
- Home.vue 的 statistics grid 可能需要微调以适配 5 列布局
- 新增图标需从 @ant-design/icons-vue 正确导入

### 2.4 安全要求 (Security Requirements)

#### 2.4.1 导航入口安全 (Navigation Entry Security)
| 安全项 | 要求 | 原因 |
|--------|------|------|
| **链接目标可信** | 「挂号」菜单项和「预约挂号」按钮的跳转目标固定为 `/appointment`（硬编码字符串），不接受动态拼接或用户输入 | 防止开放重定向 (Open Redirect) |
| **无外部跳转** | 导航入口不得包含 `target="_blank"` + `rel="noopener noreferrer"` 以外的外部链接行为 | 防止 `window.opener` 劫持 |
| **图标来源** | `CalendarOutlined` 仅从 `@ant-design/icons-vue` 官方包导入，不从 CDN 或第三方加载 SVG | 保证图标资源完整性 |

#### 2.4.2 信息展示安全 (Information Display Security)
| 展示项 | 安全要求 |
|--------|----------|
| **首页统计卡片 — 预约总数** | 该数值来自 `store.getStatistics().totalAppointments`，属于聚合统计数据，不涉及单个患者的隐私信息。但需确保卡片 tooltip 或 hover 信息不会意外泄露更细粒度的数据（如按医生分布） |
| **导航高亮状态** | selectedKeys 通过 `watch(route.path)` 自动同步，不由用户输入直接控制 → 天然安全。但需确保 watch 回调中对 `/appointment` 的匹配是前缀匹配 (`startsWith`) 且不会被类似 `/appointment/evil` 的路径混淆 |
| **Hero 按钮** | 「预约挂号」按钮文案固定，不含动态变量插值，无可被注入的风险点 |

#### 2.4.3 样式注入防护 (Style Injection Prevention)
| 安全项 | 要求 |
|--------|------|
| **CSS 变量安全** | 新增的 `.stat-icon.appointment` 渐变色使用硬编码色值（如 `#faad14`），不使用 CSS `var()` 引用可能被 JS 篡改的自定义属性 |
| **动态 class 绑定** | 如使用 `:class` 绑定，确保 class 名来源于预定义的白名单字符串（如 `'stat-card'`、`'appointment'`），不接受用户输入 |

## 3. 实施方案

### 3.1 推荐方案
分别修改两个文件，每个文件改动点明确且独立。

### 3.2 实施步骤

**AppHeader.vue**：
1. 在 script setup 的 import 行中追加 CalendarOutlined
2. 在 `<a-menu>` 内部（`<a-menu-item key="consultation">` 之后）插入：
   ```html
   <a-menu-item key="appointment" @click="navigateTo('/appointment')">
     <CalendarOutlined />
     挂号
   </a-menu-item>
   ```
3. 在 watch 回调中追加 else if 分支：`else if (newPath.startsWith('/appointment')) selectedKeys.value = ['appointment']`

**Home.vue**：
1. 在 script setup 的 import 行中追加 CalendarOutlined
2. 在 hero-actions div 中（第二个 button 之后）插入新 button
3. 在 statistics section 中追加第 5 张 stat-card
4. 在 style 中追加 `.stat-icon.appointment` 的背景渐变样式

### 3.3 技术考量
- Home.vue 统计卡片使用 `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`，5 列时会自动折行
- 「预约挂号」按钮建议使用 `ghost` 类型或自定义 border-color 以区别于主 CTA

## 4. 验收标准

### 4.1 主要标准
- **标准 1**: 导航栏显示「挂号」菜单位于「问诊」和「医生」之间
  - **验证工具**: 浏览器目视检查
- **标准 2**: 点击「挂号」导航至 `/appointment`，URL 变更
  - **验证工具**: 浏览器点击 + 检查地址栏
- **标准 3**: 当前在 `/appointment` 时「挂号」菜单高亮
  - **验证工具**: 浏览器访问 /appointment 观察菜单高亮态
- **标准 4**: 首页 Hero 区显示「预约挂号」按钮，点击跳转 /appointment
  - **验证工具**: 浏览器点击验证
- **标准 5**: 首页统计卡片区显示第 5 张「预约总数」卡片，数值动态获取
  - **验证工具**: 目视检查 + Console 验证数值来源
- **标准 6**: `npm run build` 编译零错误
  - **验证工具**: npm run build
- **标准 7**: 现有导航功能和首页布局不受影响
  - **验证工具**: 回归检查所有导航项和原有 4 张统计卡

## 5. 依赖关系

### 5.1 任务依赖
- **Depends on**: TASK-003（路由 /appointment 需先就绪）
- **Blocks**: 无

### 5.2 外部依赖
- @ant-design/icons-vue (CalendarOutlined)
- vue-router

## 6. 工作量估算

| 维度 | 估算 |
|------|------|
| **预估工时** | 0.75 小时 |
| **复杂度** | 低 |
| **风险** | 低 |

## 7. 交付物

- [ ] 修改后的 `src/components/AppHeader.vue`
- [ ] 修改后的 `src/views/Home.vue`

---

*本 Task PRD 由 PRD Builder 基于 task-prd-spec.md 模板生成*
