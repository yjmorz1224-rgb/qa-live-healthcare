# Task PRD: 扩展 Consultation.vue — 患者「我的预约」标签页

**Feature ID**: FEAT-001
**Feature Name**: appointment-booking
**Task ID**: TASK-006
**Created Date**: 2026-04-27
**Status**: TODO
**Language**: zh-CN

## 1. 任务概述

### 1.1 任务摘要
在 `src/views/Consultation.vue` 的患者门户区域引入 Tabs 双标签布局，将原有的「我的问题」放入 Tab 1，新增「我的预约」Tab 2 展示当前患者的预约记录并支持取消操作。

### 1.2 任务目标
- 将 `.questions-section` 区域改造为 `a-tabs` 容器（Tab 1: 我的问题 / Tab 2: 我的预约）
- Tab 2 实现预约列表展示（Card 形式）
- 每张预约卡片展示：医生、科室、日期时段、状态 Tag、症状、操作按钮
- 实现「取消预约」功能（含二次确认 + 24h 时效校验）
- 保持 Tab 1（我的问题）的所有原有功能不变

### 1.3 关联的功能需求
- **Feature Requirement**: REQ-005（患者端预约管理）
- **Related User Story**: 故事 3（查看和管理个人预约记录）

## 2. 详细需求

### 2.1 功能需求

**Template 改造**：
```
原结构:
  .questions-section > .section-header + 问题列表

改为:
  .questions-section > a-tabs
    ├─ tab-pane key="questions" tab="我的问题"
    │    └─ 原 .section-header + 问题列表（原样移入）
    └─ tab-pane key="appointments" tab="我的预约"
         └─ 预约列表（新增）
```

**Tab 2「我的预约」内容**：
- 顶部可选：快捷操作栏（如刷新按钮）
- 列表形式：`v-for` 遍历 `myAppointments`，每项为一个 Card
- 每个 Card 内容：
  - Header: 医生姓名 + 科室 Tag (`a-tag color="blue"`) + 状态 Tag（颜色映射见下）
  - Body: 预约时间（大字突出显示 `appointmentDate + timeSlotLabel`）+ 症状描述 + 创建时间（小字灰色）
  - Footer: 操作按钮区（条件渲染）
- 状态 Tag 颜色映射：
  | 状态 | 颜色 | 文案 |
  |------|------|------|
  | pending | orange | 待确认 |
  | confirmed | green | 已确认 |
  | completed | blue | 已完成 |
  | cancelled | default (灰) | 已取消 |

**取消预约交互**：
1. 仅 pending / confirmed 状态显示「取消预约」按钮
2. 点击 → `Modal.confirm()` 二次确认弹窗
3. 弹窗内容：确认提示文字 + 可选原因输入
4. 确认回调：调用 `store.cancelAppointment(appointmentId)`
5. 业务校验：Store 层内部检查距预约时间是否 ≥ 24h，不足则 message.warning 阻止
6. 取消成功后 message.success + 列表即时更新（reactive 响应式自动处理）
7. 已取消的预约不再显示取消按钮，改为显示取消原因（如有）

**空状态**：
- `myAppointments.length === 0` 时显示 `<a-empty description="暂无预约记录" />`

### 2.2 技术需求
- 修改文件：`src/views/Consultation.vue`（唯一修改文件）
- 新增 Ant Design Vue 组件：a-tabs, a-tab-pane, Modal.confirm（从 ant-design-vue 导入）
- 新增图标：CalendarOutlined
- Script 侧新增：myAppointments computed, portalActiveTab ref, handleCancelAppointment method

### 2.3 约束与限制
- 原有的 auth-section（身份验证区）完全不动
- 原有的 submitModal（提交问题弹窗）完全不动
- 原有问题相关的所有变量和方法（myQuestions, submitQuestion 等）保留不变
- 默认激活 Tab 为「我的问题」（portalActiveTab 初始值 = 'questions'）
- 取消操作依赖 TASK-002 实现的 cancelAppointment 方法

### 2.4 安全要求 (Security Requirements)

#### 2.4.1 越权访问防护 (Authorization & IDOR Prevention)
| 安全风险 | 防护措施 |
|----------|----------|
| **垂直越权 — 未登录查看预约** | 「我的预约」Tab 的内容区域使用 `v-if="currentPatient"` 门控，未验证身份时不渲染任何预约数据 |
| **水平越权 — 查看他人预约** | `myAppointments` computed 通过 `store.getAppointmentsByPatient(currentPatient.value.id)` 获取数据，天然限定为当前登录患者的预约。**关键**: 组件中不得出现手动 filter appointments 数组的逻辑（绕过 Store 权限边界） |
| **URL 参数操控** | Tab 切换通过 `portalActiveTab` ref 控制（本地状态），不依赖 URL 参数。即使用户尝试构造 `/consultation?tab=appointments&patientId=other_patient` 也无法获取他人数据 |

#### 2.4.2 取消预约操作安全 (Cancel Appointment Security)
| 安全项 | 要求 | 实现 |
|--------|------|------|
| **身份二次确认** | 点击「取消预约」后必须弹出 `Modal.confirm` 二次确认框，明确告知用户即将取消的具体预约信息（医生名+日期+时段），防止误操作 | Modal.confirm content 中展示预约摘要 |
| **24h 时效强制校验** | 调用 `store.cancelAppointment()` 前可做前端预检（计算小时差 < 24h 则直接 warning 阻止弹出确认框），减轻 Store 层压力；最终校验仍由 Store 层兜底 | 前端预检 + Store 兜底的双重保障 |
| **取消原因安全处理** | 如支持用户输入取消原因：① 限制最长 100 字符；② 输入框使用普通 `a-input`/`a-textarea`（纯文本控件）；③ 提交给 Store 后由 Store 层执行 HTML 转义 | 多层防护链 |
| **操作审计日志** (建议 MVP 后期) | 每次 cancel 操作可在 Console 输出 `{ action: 'CANCEL_APPOINTMENT', appointmentId, patientId, timestamp }` 用于调试追踪，生产环境应移除或发送至服务端 | 开发阶段辅助调试 |

#### 2.4.3 数据展示安全 (Data Display Security)
| 展示内容 | XSS 防护方式 |
|----------|-------------|
| 预约卡片 — 医生姓名、科室 | 来自 Store 的静态数据（Doctor 实体），非用户输入，低风险。但仍通过 `{{ }}` 文本插值展示 |
| 预约卡片 — 日期、时段 | 格式化的字符串常量，零风险 |
| 预约卡片 — **症状描述 (symptoms)** | ⚠️ **高风险字段**：用户输入内容。**必须**使用 `{{ appt.symptoms }}` 文本插值，**禁止**使用 `v-html`。Ant Design Vue Card 的 default slot 默认为文本模式 |
| 预约卡片 — 取消原因 | 同 symptoms，用户输入内容，文本插值展示 |
| 状态 Tag | 预定义颜色映射（orange/green/blue/default），无用户输入 |

#### 2.4.4 空状态与异常安全 (Empty State & Exception Safety)
| 场景 | 安全要求 |
|------|----------|
| 无预约记录 | 显示 `<a-empty description="暂无预约记录" />`，不暴露「您没有任何预约」以外的额外信息（如「数据库查询返回 0 条」） |
| currentPatient 为 null | 整个 Tab 区域不渲染（`v-if` 门控），不显示空白卡片骨架或报错堆栈 |
| Store 方法调用异常 | `handleCancelAppointment` 中的 `store.cancelAppointment()` 调用应包裹在 try-catch 中，catch 时展示 `message.error('操作失败，请重试')` 而非原始错误对象 |

## 3. 实施方案

### 3.1 推荐方案
将 `.questions-section` 内部的 DOM 结构包裹进 `a-tabs`，原有内容移入第一个 tab-pane，第二个 tab-pane 写入新的预约列表逻辑。

### 3.2 实施步骤
1. **Import 补充**：在 script setup 中追加 `CalendarOutlined` 和 `Modal`（如尚未导入）
2. **新增 reactive 状态**：
   ```typescript
   const portalActiveTab = ref<string>('questions');
   ```
3. **新增 computed**：
   ```typescript
   const myAppointments = computed(() =>
     currentPatient.value ? store.getAppointmentsByPatient(currentPatient.value.id) : []
   );
   ```
4. **新增方法**：
   ```typescript
   const handleCancelAppointment = (appt: Appointment) => {
     // 1. 计算距预约时间的小时差
     // 2. < 24h → message.warning 阻止
     // 3. ≥ 24h → Modal.confirm 二次确认
     // 4. onOk → store.cancelAppointment(appt.id) + message.success
   };
   ```
5. **Template 改造**：
   - 在 `<div class="questions-section">` 内部，将原来的 header + list 包裹进 `<a-tabs>`
   - 追加第二个 `<a-tab-pane key="appointments">`
6. **Style 微调**：tabs 样式可能需要少量调整（去除 section-header 的 margin-bottom 与 tabs 自身 padding 的冲突等）

## 4. 验收标准

### 4.1 主要标准
- **标准 1**: 患者门户显示两个 Tab：「我的问题」和「我的预约」，默认选中前者
  - **验证工具**: 浏览器访问 /consultation 验证身份后观察
- **标准 2**: 「我的预约」Tab 正确列出当前患者的全部预约记录
  - **验证工具**: 切换 Tab 后检查列表内容
- **标准 3**: 每张预约卡片信息完整（医生、科室、日期、时段、状态、症状）
  - **验证工具**: 逐字段核对
- **标准 4**: 状态 Tag 颜色编码符合规格
  - **验证工具**: 视觉检查
- **标准 5**: pending/confirmed 预约显示「取消预约」按钮，点击后弹出二次确认
  - **验证工具**: 点击按钮观察 Modal 弹窗
- **标准 6**: 距就诊不足 24 小时时取消被阻止并显示提示
  - **验证工具**: 构造 <24h 场景测试（或直接看 Store 层的校验逻辑）
- **标准 7**: 取消成功后预约变为 cancelled 状态，取消按钮消失
  - **验证工具**: 执行取消后观察卡片变化
- **标准 8**: 「我的问题」Tab 的提交问题、查看回复等功能完全正常
  - **验证工具**: 回归测试原有功能
- **标准 9**: `npm run build` 编译通过
  - **验证工具**: npm run build

### 4.2 边界情况
- 患者没有任何预约记录时显示 empty 占位
- 已完成/已取消的预约不应显示操作按钮
- 连续快速切换 Tab 不应有异常

## 5. 依赖关系

### 5.1 任务依赖
- **Depends on**: TASK-002（Store 方法就绪）
- **Blocks**: TASK-008

### 5.2 外部依赖
- ant-design-vue (Tabs, Modal, Tag, Empty, Card 组件)
- @ant-design/icons-vue (CalendarOutlined)

## 6. 工作量估算

| 维度 | 估算 |
|------|------|
| **预估工时** | 1 小时 |
| **复杂度** | 中 |
| **风险** | 中（修改核心页面 Consultation.vue）|

## 7. 交付物

- [ ] 修改后的 `src/views/Consultation.vue`

---

*本 Task PRD 由 PRD Builder 基于 task-prd-spec.md 模板生成*
