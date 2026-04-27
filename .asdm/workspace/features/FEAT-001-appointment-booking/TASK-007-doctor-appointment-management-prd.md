# Task PRD: 扩展 DoctorRoom.vue — 医生端预约管理区域

**Feature ID**: FEAT-001
**Feature Name**: appointment-booking
**Task ID**: TASK-007
**Created Date**: 2026-04-27
**Status**: TODO
**Language**: zh-CN

## 1. 任务概述

### 1.1 任务摘要
在 `src/views/DoctorRoom.vue` 的底部新增「预约管理」区域，包含两个子区域：「待处理预约」（Card 列表 + 确认/拒绝操作）和「已确认预约」（Table 展示 + 完成操作）。使医生能在诊室中统一管理线下门诊预约。

### 1.2 任务目标
- 在 answered-section 之后新增 appointment-section 区块
- 子区域 A：展示 pending 状态预约，支持「确认预约」和「拒绝」操作
- 子区域 B：以 Table 展示 confirmed 状态预约，支持「完成」操作
- 拒绝操作支持填写拒绝原因
- 保持现有「待响应问题」和「已解答问题」区域完全不变

### 1.3 关联的功能需求
- **Feature Requirement**: REQ-006（医生端预约管理）
- **Related User Story**: 故事 4（医生查看和处理预约请求）

## 2. 详细需求

### 2.1 功能需求

**新增区域位置**：`</div><!-- /.answered-section -->` 之后

**子区域 A — 待处理预约**：
- 标题：`<h2>待处理预约 ({{ pendingAppointments.length }})</h2>`
- 空状态：`<a-empty description="暂无待处理预约" />`
- 卡片列表：遍历 `pendingAppointments`
  - 每张卡片 (.appt-card) 内容：
    - Header: 患者名 + 预约日期+时段
    - Body: 症状描述（最多 2 行截断或 ellipsis）
    - Footer: 两个按钮 — `[确认预约]` (primary) + `[拒绝]` (danger)
- 「确认预约」→ 调用 `store.confirmAppointment(id)` → message.success
- 「拒绝」→ `Modal.confirm({ title: '拒绝预约', content: 含可选原因 Input })` → onOk 调用 `store.rejectAppointment(id, reason)` → message.success

**子区域 B — 已确认预约**：
- 标题：`<h2>已确认预约 ({{ confirmedAppointments.length }})</h2>`
- 空状态：`<a-empty description="暂无已确认预约" />`
- 使用 `a-table` 展示（比 Card 更紧凑，适合多条记录）
  - 列定义 (columns)：
    | 列标题 | dataIndex | 说明 |
    |--------|-----------|------|
    | 日期 | appointmentDate | 预约日期 |
    | 时段 | timeSlotLabel | 时间段 |
    | 患者 | patientName | 患者姓名 |
    | 症状 | symptoms | ellipsis 截断 |
    | 操作 | (slot) | 「完成」按钮 |
  - rowKey="id", size="small", pagination={{ pageSize: 5 }}
- 操作列「完成」→ 调用 `store.completeAppointment(id)` → message.success

**Script 侧新增**：
- computed: `pendingAppointments`, `confirmedAppointments`
- ref: apptColumns (Table 列定义常量)
- methods: handleConfirm(appt), handleReject(appt), handleComplete(appt)
- import: CalendarOutlined, Modal (如未导入), Appointment 类型

**Style 侧新增**：
- `.appointment-section`：复用 `.answered-section` 相同样式（白底圆角卡片 + box-shadow + padding 24px + margin-bottom 24px）
- `.appt-card`：复用 `.question-card` 风格（边框、圆角、内边距、浅色背景）
- `.appt-header`：flex 两端对齐（患者名 + 时间）
- `.appt-actions`：按钮间距 gap: 12px

### 2.2 技术需求
- 修改文件：`src/views/DoctorRoom.vue`
- 新增 Ant Design Vue 组件：a-table, a-empty, Modal.confirm, a-button
- 新增图标：CalendarOutlined

### 2.3 约束与限制
- 不修改 room-header、room-url、questions-section、answered-section
- 不修改 answerModal（回复问题的 Modal）
- 不修改 onMounted 权限守卫逻辑
- 拒绝 Modal 中的原因输入为可选（不是必填）

### 2.4 安全要求 (Security Requirements)

#### 2.4.1 医生身份守卫 (Doctor Authentication Guard)
| 安全项 | 要求 | 现状 |
|--------|------|------|
| **页面级权限** | DoctorRoom.vue 已有 `onMounted` 权限守卫（未登录医生时跳转 `/doctor/login`），**本任务不得移除或弱化此守卫** | 已有 ✅ |
| **预约管理区可见性** | `.appointment-section` 区域不需要额外的 `v-if` 门控（因为整个页面已被守卫保护）。但新增的 computed 属性在 `currentDoctor` 为 null 时应安全返回空数组 `[]` 而非抛异常 | 需要实现 |
| **数据隔离** | `store.getPendingAppointments(currentDoctor.value.id)` 天然按 doctorId 过滤，确保医生 A 登录后看不到医生 B 的预约数据 | Store 层保证 ✅ |

#### 2.4.2 操作权限与审计 (Operation Authorization & Audit)
| 操作 | 权限要求 | 安全实现 |
|------|----------|----------|
| **确认预约 (handleConfirm)** | 仅当前登录医生可以确认分配给自己的预约 | ① 按钮仅出现在 pendingAppointments 列表中（已过滤为当前医生的数据）② Store 层 `confirmAppointment()` 内部再次校验 doctorId 匹配（TASK-002 安全要求覆盖）③ 操作后 message 反馈不暴露 appointmentId |
| **拒绝预约 (handleReject)** | 同上 + 拒绝原因安全处理 | ① Modal.confirm 二次确认 ② 原因输入框限制 200 字符 ③ 原因经 Store 层 HTML 转义后存储 ④ message 反馈不包含原因原文 |
| **完成预约 (handleComplete)** | 仅当前登录医生可以将 confirmed 预约标记为完成 | Table 操作列按钮仅对 confirmedAppointments 数据行渲染；Store 层 `completeAppointment()` 内部校验状态合法性 |

#### 2.4.3 拒绝操作的 Modal 安全 (Rejection Modal Security)
| 安全项 | 要求 |
|--------|------|
| **Modal 内容安全** | `Modal.confirm` 的 `content` 属性如果使用 JSX/h() 渲染包含 Input 的自定义内容，确保 Input 的 `v-model`/`onChange` 绑定的值不直接插入 DOM（使用受控组件模式） |
| **原因输入控件** | 使用 `<a-input />` 或 `<a-textarea />` （Ant Design Vue 的受控组件），天然对值进行文本处理，不使用原生 `<input>` + `dangerouslySetInnerHTML` |
| **onOk 回调安全** | onOk 中读取 Input 值后直接传给 `store.rejectAppointment(id, reason)`，由 Store 层负责转义和长度截断。**组件层不做额外假设** |
| **onCancel 安全** | 点击取消时无需清理 Input 值（Modal 关闭后组件销毁自动释放），但需确保取消操作不会触发表单提交副作用 |

#### 2.4.4 信息展示安全 (Information Disclosure in Doctor Panel)
| 展示内容 | 安全要求 |
|----------|----------|
| **待处理卡片 — 患者姓名** | 显示 `appt.patientName`（冗余字段）。这是医生查看自己诊室预约所需的合理信息，不属于越权泄露。但**不得**在此处展示患者的 phone、birthday、address 等更敏感的 PII |
| **待处理卡片 — 症状描述** | 显示 `appt.symptoms`，使用文本插值（Card body 默认 text mode）。症状信息是医生做出确认/拒绝决策所需的核心信息，属于合理的最小必要信息披露原则 |
| **已确认 Table — 数据列** | Table 的 5 列（日期、时段、患者、症状、操作）均为医生管理预约所需的最小信息集。**禁止**追加 patientId、createdAt 详细时间戳、取消原因等不必要的列 |
| **数量统计** | 标题中的 `({{ pendingAppointments.length }})` 和 `({{ confirmedAppointments.length }})` 是聚合计数，安全 |

#### 2.4.5 异常处理安全 (Exception Handling Security)
| 场景 | 安全处理方式 |
|------|--------------|
| store 方法抛出异常 | handleConfirm / handleReject / handleComplete 每个方法都应包裹 try-catch，catch 时 `message.error('操作失败，请稍后重试')`，**禁止**将 error.message 或 error.stack 展示给用户 |
| concurrent modification | 若医生快速连续点击「确认」和「完成」（极端情况），Store 层的状态机校验会阻止非法跃迁（confirmed → completed 是合法的，但第二次点击时状态已是 completed，操作会被 Store 忽略），前端 message 提示即可 |
| Table 分页安全 | `pagination={{ pageSize: 5 }}` 使用 Ant Design Vue 内置分页，无自定义分页参数接受用户输入，安全 |

## 3. 实施方案

### 3.1 推荐方案
在 DoctorRoom.vue 底部追加 appointment-section 模板块和相关脚本逻辑。

### 3.2 实施步骤
1. **Import 补充**：追加 CalendarOutlined（可能还需 Modal）
2. **Script 新增**：
   - pendingAppointments / confirmedAppointments computed
   - apptColumns 数组（5 列定义）
   - handleConfirm / handleReject / handleComplete 三个方法
3. **Template 追加**：在 `</div><!-- /.answered-section -->` 后插入完整的 appointment-section HTML 块
4. **Style 追加**：.appointment-section 及子元素样式

### 3.3 技术考量
- handleReject 中的 Modal.confirm content 可以用 JSX 或 h() 函数渲染包含 Input 的内容
- Table 的 bodyCell slot 用于渲染操作列的自定义按钮
- 确保所有 store 方法调用都有 try-catch 或前置判空保护

## 4. 验收标准

### 4.1 主要标准
- **标准 1**: 医生诊室底部显示「预约管理」区域标题
  - **验证工具**: 以医生登录后滚动到底部观察
- **标准 2**: 「待处理预约」正确列出当前医生的全部 pending 预约
  - **验证工具**: 检查卡片列表内容和数量
- **标准 3**: 「确认预约」按钮点击后预约状态变为 confirmed 并移至已确认区域
  - **验证工具**: 点击确认后观察两个区域的变化
- **标准 4**: 「拒绝」按钮弹出确认对话框，确认后状态变为 cancelled
  - **验证工具**: 点击拒绝 → 确认 → 观察 pending 列表中该条消失
- **标准 5**: 「已确认预约」Table 正确展示列信息和分页
  - **验证工具**: 检查 Table 各列数据
- **标准 6**: Table 中「完成」按钮点击后预约状态变为 completed
  - **验证工具**: 点击完成后观察行消失（status 过滤掉）
- **标准 7**: 空状态有 appropriate empty 占位
  - **验证工具**: 清空预约数据后观察
- **标准 8**: 现有的待响应问题和已解答问题功能完全不受影响
  - **验证工具**: 回归测试原有区域
- **标准 9**: `npm run build` 编译通过
  - **验证工具**: npm run build

## 5. 依赖关系

### 5.1 任务依赖
- **Depends on**: TASK-002（Store 方法就绪）
- **Blocks**: TASK-008

### 5.2 外部依赖
- ant-design-vue (Table, Empty, Modal, Button, Tag)
- @ant-design/icons-vue (CalendarOutlined)

## 6. 工作量估算

| 维度 | 估算 |
|------|------|
| **预估工时** | 1 小时 |
| **复杂度** | 中 |
| **风险** | 中（修改医生诊室核心页面）|

## 7. 交付物

- [ ] 修改后的 `src/views/DoctorRoom.vue`

---

*本 Task PRD 由 PRD Builder 基于 task-prd-spec.md 模板生成*
