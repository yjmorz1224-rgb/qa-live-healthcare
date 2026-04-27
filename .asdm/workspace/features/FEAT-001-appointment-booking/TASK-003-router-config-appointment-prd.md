# Task PRD: 新增 /appointment 路由配置

**Feature ID**: FEAT-001
**Feature Name**: appointment-booking
**Task ID**: TASK-003
**Created Date**: 2026-04-27
**Status**: DONE
**Language**: zh-CN

## 1. 任务概述

### 1.1 任务摘要
在 `src/router/index.ts` 中注册 `/appointment` 路由，指向即将创建的 Appointment.vue 组件。同时创建一个空的 Appointment.vue 占位文件以确保路由引用不会导致编译失败。

### 1.2 任务目标
- 在 router 配置中新增 `/appointment` 路由规则
- 创建 `src/views/Appointment.vue` 占位组件（最小可运行 SFC）
- 确保 `npm run build` 编译通过

### 1.3 关联的功能需求
- **Feature Requirement**: REQ-004（路由部分）
- **Related User Story**: 故事 2（提交预约入口）、故事 5（首页入口）

## 2. 详细需求

### 2.1 功能需求
- 路由路径：`/appointment`
- 路由名称：`'Appointment'`
- 组件：`src/views/Appointment.vue`
- 路由位置：建议放在 `/consultation/:doctorUsername` 之后、`/doctors` 之前

### 2.2 技术需求
- 修改文件：`src/router/index.ts`
- 新建文件：`src/views/Appointment.vue`（占位 SFC）
- 使用 `createWebHistory` 模式（与现有路由一致）

### 2.3 约束与限制
- 占位组件只需包含最基础的 `<template><div>预约挂号</div></template>` + `<script setup>` 结构即可
- 不应影响现有 7 条路由的正常工作

### 2.4 安全要求 (Security Requirements)

#### 2.4.1 路由注册安全
| 安全项 | 要求 | 原因 |
|--------|------|------|
| **路径规范化** | `/appointment` 路径以 `/` 开头，不含 `..`、`//`、特殊字符等路径穿越模式 | 防止路径注入攻击 |
| **组件来源可信** | `import Appointment from '../views/Appointment.vue'` 必须指向项目内部的 `.vue` 文件，禁止从 CDN 或外部 URL 加载组件 | 防止供应链攻击 |
| **路由元信息** (建议) | 在路由配置中添加 `meta: { requiresAuth: true, role: 'patient' }` 元信息，为后续路由守卫预留安全钩子 | 支持未来扩展的认证/授权拦截 |

#### 2.4.2 占位组件安全基线
| 安全项 | 要求 |
|--------|------|
| **最小攻击面** | 占位组件的 template 不含任何用户可控的插值（如 `{{ userinput }}`），纯静态文本 |
| **Script 安全校验** | `<script setup lang="ts">` 块中不引入任何危险的 API（eval、innerHTML、document.write 等）；仅包含最基础的结构注释 |
| **样式隔离** | 使用 `scoped` CSS，防止全局样式污染或被外部利用 |
| **无敏感信息** | 占位文本「预约挂号」不含任何系统内部信息（版本号、技术栈细节等） |

#### 2.4.3 路由冲突检测
| 安全项 | 要求 |
|--------|------|
| **唯一性保证** | `/appointment` 路径不能与现有路由产生歧义或冲突 |
| **通配符安全** | 新增路由不影响现有的动态路由（`:doctorUsername`）的参数捕获逻辑 |

## 3. 实施方案

### 3.1 推荐方案
两步走：(1) 创建占位组件 (2) 注册路由

### 3.2 实施步骤
1. 新建 `src/views/Appointment.vue`：
   ```vue
   <template>
     <div class="appointment">预约挂号</div>
   </template>
   <script setup lang="ts">
   // 占位 - TASK-004 将完善此组件
   </script>
   <style scoped>
   .appointment { padding-top: 64px; min-height: calc(100vh - 64px); }
   </style>
   ```

2. 修改 `src/router/index.ts`：
   - 顶部 import 区域新增：`import Appointment from '../views/Appointment.vue';`
   - routes 数组中（在 ConsultationRoom 路由之后）新增路由对象

3. 运行 `npm run build` 验证编译通过

### 3.3 技术考量
- 此任务仅建立"骨架"，具体内容由 TASK-004 实现
- 占位组件必须存在否则 Vite/TSC 会报模块找不到错误
- 路由顺序不影响功能但建议按语义分组放置

## 4. 验收标准

### 4.1 主要标准
- **标准 1**: `npm run build` 编译零错误
  - **验证工具**: npm run build (exit code 0)
- **标准 2**: 浏览器访问 `/appointment` 能渲染占位组件（显示「预约挂号」文字）
  - **验证工具**: 浏览器手动验证
- **标准 3**: 现有 7 条路由仍然正常工作
  - **验证工具**: 浏览器依次访问 `/`, `/consultation`, `/doctors`, `/about`, `/doctor/login`

### 4.2 边界情况
- 直接访问 `/appointment` 不应出现空白页或 404
- 路由参数解析不受影响

## 5. 依赖关系

### 5.1 任务依赖
- **Depends on**: 无（可与 TASK-002 并行执行）
- **Blocks**: TASK-005（导航入口依赖此路由）

### 5.2 外部依赖
- vue-router ^4.6.3

## 6. 工作量估算

| 维度 | 估算 |
|------|------|
| **预估工时** | 0.25 小时 |
| **复杂度** | 低 |
| **风险** | 低 |

## 7. 交付物

- [ ] 修改后的 `src/router/index.ts`
- [ ] 新建的 `src/views/Appointment.vue`（占位版）

---

*本 Task PRD 由 PRD Builder 基于 task-prd-spec.md 模板生成*
