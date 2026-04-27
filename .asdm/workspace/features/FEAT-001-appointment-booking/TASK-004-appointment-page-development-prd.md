# Task PRD: 开发预约挂号页面 Appointment.vue

**Feature ID**: FEAT-001
**Feature Name**: appointment-booking
**Task ID**: TASK-004
**Created Date**: 2026-04-27
**Status**: TODO
**Language**: zh-CN

## 1. 任务概述

### 1.1 任务摘要
开发完整的预约挂号独立页面 `src/views/Appointment.vue`，实现三步流程：身份验证 → 选择医生+日期时段 → 提交预约。这是患者端预约的核心交互界面。

### 1.2 任务目标
- 完善 TASK-003 创建的占位组件为完整功能页面
- 实现患者身份验证门控（复用 Consultation.vue 的验证模式）
- 实现医生选择卡片网格
- 实现日期选择 + 排班时段展示（含可用性判断）
- 实现症状描述输入和预约提交流程
- 实现成功结果弹窗

### 1.3 关联的功能需求
- **Feature Requirement**: REQ-003（预约挂号页面）
- **Related User Story**: 故事 1（浏览排班）、故事 2（提交预约）

## 2. 详细需求

### 2.1 功能需求

**页面整体布局**：
- 采用与 Consultation.vue 一致的容器样式（max-width: 1200px, 居中）
- 未验证时显示身份验证表单区域（居中大卡片）
- 验证后切换至预约主界面

**身份验证区**（复用 Consultation.vue 逻辑）：
- 姓名 input + 生日 DatePicker（YYYY-MM-DD 格式）
- 提交按钮 → `store.verifyPatient(name, birthday)`
- 成功后切换显示预约主界面

**步骤 1 — 选择医生**：
- 展示 `store.getActiveDoctors()` 卡片网格
- 每张卡片：头像、姓名、职称·科室、经验
- 点击选中高亮（同 Doctors.vue active 样式）
- 未选医生时后续步骤置灰/提示

**步骤 2 — 选择日期和时段**：
- DatePicker 限制范围：今天起未来 7 天的工作日（周一~周五，排除周末）
- 选中医生后加载 `store.getDoctorSchedule(doctorId, 7)`
- 分「上午」「下午」两个区块展示时段
- 每个时段显示：时间标签 + 剩余号数（如"剩余 2/3"）
- 已满时段（bookedCount ≥ maxCapacity）：置灰 disabled 态
- 可选时段点击选中（单选高亮）
- 切换医生时重置已选日期和时段

**步骤 3 — 提交预约**：
- 症状描述 textarea（必填，最多 200 字）
- 提交按钮（loading 防重复点击）
- 调用 `store.createAppointment(data)`
- 成功后弹出 Modal 显示：预约编号、医生名、科室、日期、时段、状态
- Modal 提供「查看我的预约」按钮跳转 `/consultation`（带 hash 或 query 标识跳转到预约 Tab）

**使用的 Ant Design Vue 组件**：
a-card, a-card-grid, a-date-picker, a-radio-group/a-button(group), a-textarea,
a-button, a-modal, a-tag, a-alert, a-empty, a-divider, a-steps(可选), a-form-item

### 2.2 技术需求
- 修改文件：`src/views/Appointment.vue`（替换占位内容）
- `<script setup lang="ts">` + Composition API
- scoped CSS，视觉风格对齐 Consultation.vue 和 Doctors.vue
- 引入 store 的新方法和 Appointment 类型

### 2.3 约束与限制
- 页面宽度最大 1200px，padding 24px
- 身份验证复用 verifyPatient 方法，不重新实现
- 时段容量上限为 3（由 Store 层 isTimeSlotFull 控制）
- 提交模拟 500ms loading 效果（与现有 Question 提交保持一致）

### 2.4 安全要求 (Security Requirements)

#### 2.4.1 身份验证安全 (Authentication Security)
| 安全项 | 要求 | 实现 |
|--------|------|------|
| **验证门控** | 未完成身份验证的用户**绝对无法**看到预约主界面（医生选择、时段选择等） | 使用 `v-if="currentPatient"` 控制整个预约表单区域的渲染，而非仅仅 CSS 隐藏 |
| **会话状态一致性** | 页面加载时检查 `store.currentPatient` 是否存在且有效；若不存在立即显示验证表单，不展示任何预约相关 UI | 在 `onMounted` 或模板层做双重检查 |
| **验证信息传输** | 姓名+生日通过 `verifyPatient()` 提交时，不在 URL query params、localStorage 明文中留下完整信息 | 验证成功后仅在 Vue reactive state 中持有引用 |

#### 2.4.2 输入验证与 XSS 防护 (Input Validation & XSS Prevention)
| 输入字段 | 校验规则 | XSS 防护 |
|----------|----------|----------|
| **姓名 (authForm.name)** | 必填，1-20 字符，仅允许中文/字母/空格 | 使用 `a-input` 组件自动转义；提交前 trim() |
| **生日 (authForm.birthday)** | 必填，有效日期格式，不能晚于今天，不能早于 1900 年 | DatePicker 组件自动处理；dayjs 解析校验 |
| **症状描述 (symptomText)** | 必填，5-500 字符 | ⚠️ **关键**: 存储前经 Store 层 HTML 转义；页面展示时使用文本插值 `{{ }}` 而非 `v-html`；textarea 本身为纯文本控件，降低风险 |
| **医生选择** | 单选，必须在可用列表范围内 | 使用预定义列表的 id 匹配，不接受自由输入 |
| **时段选择** | 单选，必须是该医生当日可用时段之一 | 使用预定义 slot key 匹配 |

**XSS 防护原则**：
- 全页禁用 `v-html` 渲染用户输入内容（包括症状描述、预约编号等）
- Ant Design Vue 的 `a-textarea`、`a-input` 默认对值进行文本插值，天然防 XSS
- Modal 中的预约详情使用 `a-descriptions` 组件展示（自动文本转义）

#### 2.4.3 CSRF 与重放防护 (CSRF & Replay Protection)
| 安全项 | 要求 | 实现 |
|--------|------|------|
| **防重复提交 (Double-submit)** | 用户点击「提交预约」后，按钮必须立即进入 disabled/loading 态，直到请求完成 | 使用 `submitting` ref 状态锁，`<a-button :loading="submitting" :disabled="submitting">` |
| **提交流程幂等** | 即使网络延迟导致用户多次看到 loading 结态，Store 层的 `createAppointment` 会通过时段容量检查阻止重复创建同一时段预约 | 依赖 TASK-002 的 Store 层安全实现 |
| **Loading 超时** | 设置最大 loading 时长（建议 5 秒），超时后恢复按钮状态并提示用户重试 | `setTimeout(() => { submitting.value = false }, 5000)` 作为兜底 |

#### 2.4.4 信息披露控制 (Information Disclosure)
| 场景 | 安全要求 |
|------|----------|
| **时段剩余号数** | 显示「剩余 N/M 个号」而非具体「已有 X 人预约」，隐藏精确的预约量信息 |
| **医生排班信息** | 仅显示未来 7 天的工作日排班，不显示历史排班或医生的完整日程安排 |
| **错误消息** | 表单验证失败的提示信息不得暴露内部实现细节（如「store.createAppointment returned null」→ 改为「该时段已约满，请选择其他时段」） |
| **成功弹窗** | 显示预约信息时，不暴露内部 ID 格式规则或数据库结构 |

#### 2.4.5 URL 安全 (URL Safety)
| 安全项 | 要求 |
|--------|------|
| **Query Params 敏感性** | 从结果 Modal 跳转到「我的预约」Tab 时，若使用 URL hash 或 query 参数，确保不携带预约 ID、患者信息等敏感参数 |
| **Referer 保护** | 预约提交成功后的跳转不依赖 document.referer 进行业务判断（referer 可能被伪造或丢失） |

## 3. 实施方案

### 3.1 推荐方案
参考 Consultation.vue 的门控模式和Doctors.vue的卡片网格模式进行组合开发。

### 3.2 实施步骤
1. 替换 Appointment.vue 的 template 为完整的预约流程 UI
2. 实现 script setup 逻辑：
   - computed: currentPatient, availableDoctors, selectedDoctor, scheduleSlots, selectedSlot
   - ref: authForm, selectedDate, symptomText, submitModalVisible, submitting, resultAppointment
   - methods: verifyPatient, selectDoctor, selectDate, selectSlot, submitAppointment, formatTime
3. 实现 scoped 样式：
   - 复用 .consultation-container 类似的容器
   - 渐变色头部（可用蓝色系渐变区分于问诊页面的紫色）
   - 卡片网格使用 CSS Grid
   - 时段按钮使用 flex 布局，支持 hover/active/disabled 三态
4. 日期选择器禁用周末的逻辑：使用 `disabledDate` prop 回调判断 dayjs().day() === 0 || dayjs().day() === 6
5. 提交成功弹窗使用 a-modal 包裹 a-descriptions 组件展示详情

### 3.3 技术考量
- 步骤间联动：选医生 → 加载排班 → 选日期 → 渲染时段 → 选时段 → 启用提交
- 表单校验：医生必选、日期必选、时段必选、症状必填非空
- 时段可用性由 Store 层计算（每次渲染时实时查询 isTimeSlotFull）

## 4. 验收标准

### 4.1 主要标准
- **标准 1**: 页面正常渲染，未验证显示身份验证表单
  - **验证工具**: 浏览器访问 /appointment
- **标准 2**: 验证通过后显示预约主界面，包含三个步骤区域
  - **验证工具**: 浏览器手动验证流程
- **标准 3**: 医生选择网格正确展示在线医生，支持选中/取消
  - **验证工具**: 点击医生卡片观察高亮变化
- **标准 4**: 日期选择器排除周末，范围限于未来 7 天
  - **验证工具**: 尝试选择周末日期（应禁用）和超过 7 天的日期
- **标准 5**: 时段列表根据所选医生动态加载，已满时段置灰
  - **验证工具**: 观察时段卡片的 disabled 状态
- **标准 6**: 填写完整信息后提交成功创建预约并显示结果弹窗
  - **验证工具**: 完整提交流程 + 查看 Modal 内容
- **标准 7**: `npx vue-tsc --noEmit` 零类型错误
  - **验证工具**: vue-tsc
- **标准 8**: `npm run build` 编译通过
  - **验证工具**: vite build

### 4.2 边界情况
- 未选医生时点击日期或时段应给出提示
- 切换医生后已选日期/时段应清空
- 快速双击提交按钮不应产生重复预约（loading guard）
- 症状超长文本应截断或限制输入

## 5. 依赖关系

### 5.1 任务依赖
- **Depends on**: TASK-001（数据文件）、TASK-002（Store 方法）
- **Blocks**: TASK-008（联调测试）

### 5.2 外部依赖
- ant-design-vue ^4.2.6, dayjs ^1.11.19, @ant-design/icons-vue

## 6. 工作量估算

| 维度 | 估算 |
|------|------|
| **预估工时** | 2 小时 |
| **复杂度** | 高 |
| **风险** | 中 |

## 7. 交付物

- [ ] 完整实现的 `src/views/Appointment.vue`（替换占位内容）

---

*本 Task PRD 由 PRD Builder 基于 task-prd-spec.md 模板生成*
