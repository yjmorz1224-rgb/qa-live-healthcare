# Feature PRD: 预约挂号功能

**Feature ID**: FEAT-001
**Created Date**: 2026-04-27
**Status**: PLANNED
**Language**: zh-CN

## 1. 概述

### 1.1 功能摘要

**功能描述**：在医疗问诊平台中新增「预约挂号」功能，允许患者在线预约医生的线下门诊。

**业务价值**：
- **用户需求**：当前平台仅支持在线文字问诊，患者无法预约线下门诊，限制了服务场景
- **市场竞争力**：预约挂号是医疗平台的核心功能之一，完善线上线下闭环体验
- **目标用户**：需要线下就诊的患者群体

### 1.2 目标

1. 提供患者端预约挂号全流程（选择医生 → 选择时段 → 提交预约 → 查看预约记录）
2. 提供医生端预约管理能力（查看预约列表 → 确认/取消预约）
3. 与现有系统无缝集成，保持一致的用户体验和技术架构

## 2. 用户故事

### 故事 1：患者浏览可预约医生并选择时段

**作为** 患者
**我希望能够** 查看医生的排班表和可预约的门诊时段
**以便于** 选择合适的时间进行线下就诊

**验收标准**：
- 在医生列表/详情页显示「预约挂号」入口按钮
- 展示该医生未来 7 天内的可预约时段（如：上午 9:00-10:00、10:00-11:00、下午 14:00-15:00 等）
- 已被预约满的时段应置灰或标记为「已约满」
- 支持按日期切换查看不同日期的可预约时段

### 故事 2：患者提交预约申请

**作为** 患者
**我希望能够** 填写必要信息并提交预约申请
**以便于** 完成挂号流程，获得预约确认信息

**验收标准**：
- 患者需先通过身份验证（姓名+生日）方可提交预约
- 预约表单包含：选择就诊科室、选择医生、选择预约时段、填写症状简述
- 提交后显示预约成功提示，包含预约编号、预约时间、就诊地点等信息
- 同一患者同一时段不可重复预约同一位医生

### 故事 3：患者查看和管理个人预约记录

**作为** 患者
**我希望能够在患者门户中查看我的预约记录
**以便于** 了解预约状态并进行必要的操作

**验收标准**：
- 在 Consultation.vue 患者门户中增加「我的预约」标签页
- 显示预约列表，包含：预约编号、医生姓名、科室、预约时间、状态
- 支持取消未到期的预约（就诊前 24 小时以上）
- 预约状态包括：待确认、已确认、已完成、已取消

### 故事 4：医生查看和处理预约请求

**作为** 医生
**我希望能够在诊室中查看患者的预约请求
**以便于** 安排线下门诊工作

**验收标准**：
- 在 DoctorRoom.vue 中增加「预约管理」区域
- 显示待处理的预约列表（待确认状态的预约）
- 医生可以「确认」或「拒绝」预约请求
- 显示已确认的预约日程表，便于医生安排工作时间

### 故事 5：首页展示预约入口

**作为** 访客或患者
**我希望在首页看到预约挂号的快捷入口
**以便于** 快速进入预约流程

**验收标准**：
- Home.vue 的 Hero 区域增加「预约挂号」按钮
- 点击跳转至预约挂号页面（或触发预约弹窗）
- 统计卡片区域展示今日/本周预约数量统计

## 3. 功能需求

### REQ-001：预约数据模型设计
- **ID**: REQ-001
- **描述**：定义 Appointment 数据结构，包含预约 ID、患者信息、医生信息、预约时间、状态等字段。创建 `src/data/appointment-list.json` 数据文件
- **优先级**: 高
- **相关故事**: 全部

### REQ-002：Store 层预约状态管理
- **ID**: REQ-002
- **描述**：在 `src/store/index.ts` 中扩展 Store，添加 Appointment 类型定义和相关方法（创建预约、查询预约、更新状态、获取统计数据）
- **优先级**: 高
- **相关故事**: 故事 1-4

### REQ-003：预约挂号页面开发
- **ID**: REQ-003
- **描述**：新建 `src/views/Appointment.vue` 页面组件，实现医生排班展示、时段选择、预约表单提交等功能
- **优先级**: 高
- **相关故事**: 故事 1、2

### REQ-004：路由配置与导航集成
- **ID**: REQ-004
- **描述**：在 `src/router/index.ts` 中添加 `/appointment` 路由；在 `AppHeader.vue` 和 `Home.vue` 中添加预约挂号导航入口
- **优先级**: 高
- **相关故事**: 故事 2、5

### REQ-005：患者端预约管理功能
- **ID**: REQ-005
- **描述**：在 `Consultation.vue` 患者门户中增加「我的预约」标签页，支持预约列表展示和取消预约操作
- **优先级**: 中
- **相关故事**: 故事 3

### REQ-006：医生端预约管理功能
- **ID**: REQ-006
- **描述**：在 `DoctorRoom.vue` 中增加预约管理区域，支持查看预约列表、确认/拒绝预约操作
- **优先级**: 中
- **相关故事**: 故事 4

## 4. 非功能性需求

### 4.1 性能
- 预约页面首次加载时间 < 1 秒
- 时段选择交互响应 < 100ms
- 列表渲染使用虚拟滚动（当预约数量 > 50 条时）

### 4.2 安全性
- 仅登录/验证后的患者才能提交预约
- 仅对应医生本人可操作其预约（确认/拒绝）
- 预约取消有时效限制（24 小时前）

### 4.3 可扩展性
- 数据模型预留字段以支持后续扩展（如支付、提醒等）
- 排班规则配置化，便于调整时段模板

### 4.4 可靠性
- 表单输入校验完善（必填项、格式校验、业务规则校验）
- 操作反馈明确（成功/失败提示）

## 5. 技术要求

### 5.1 与现有问诊功能的区别和联系

#### 5.1.1 功能定位对比

| 维度 | 在线问诊（现有） | 预约挂号（新增） |
|------|------------------|------------------|
| **交互模式** | 异步文字问答 | 预约线下时段 |
| **时间特征** | 实时/异步回复 | 面向未来的时间预约 |
| **核心实体** | `Question` | `Appointment` |
| **患者入口** | `/consultation` → Consultation.vue | `/appointment` → Appointment.vue + Consultation.vue 扩展 |
| **医生入口** | DoctorRoom.vue（待响应/已解答区域） | DoctorRoom.vue（新增预约管理区域） |
| **状态流转** | pending → answered | pending → confirmed → completed / cancelled |
| **身份验证** | 姓名+生日（复用） | 姓名+生日（复用） |

#### 5.1.2 共享机制

```
共享部分:
├── 患者身份验证: verifyPatient() / currentPatient    ← 完全复用
├── 医生登录体系: loginDoctor() / currentDoctor       ← 完全复用
├── 医生数据源:   state.doctors                       ← 完全复用
├── 患者数据源:   state.patients                       ← 完全复用
└── UI 组件库:    Ant Design Vue                      ← 完全复用

独立部分:
├── Question 实体 + questions[] 数组                  ← 问诊专用
├── Appointment 实体 + appointments[] 数组            ← 预约专用
├── 问诊相关 Store 方法                               ← 问诊专用
└── 预约相关 Store 方法                               ← 预约专用
```

#### 5.1.3 架构影响分析

| 影响范围 | 文件 | 变更类型 | 说明 |
|----------|------|----------|------|
| **新增文件** | `src/data/appointment-list.json` | 新建 | 预约初始数据（可为空数组） |
| **新增文件** | `src/views/Appointment.vue` | 新建 | 独立预约挂号页面 |
| **修改文件** | `src/store/index.ts` | 扩展 | 新增 Appointment 类型、appointments 字段、预约相关方法 |
| **修改文件** | `src/router/index.ts` | 扩展 | 新增 `/appointment` 路由 |
| **修改文件** | `src/views/Consultation.vue` | 扩展 | 增加「我的预约」标签页（Tabs 组件） |
| **修改文件** | `src/views/DoctorRoom.vue` | 扩展 | 增加「预约管理」区域 |
| **修改文件** | `src/components/AppHeader.vue` | 扩展 | 导航栏增加「挂号」菜单项 |
| **修改文件** | `src/views/Home.vue` | 扩展 | Hero 区域增加「预约挂号」按钮、统计卡片增加预约数 |
| **不影响文件** | `src/data/doctor-user-list.json` | 不变 | 复用现有医生数据 |
| **不影响文件** | `src/data/patient-user.json` | 不变 | 复用现有患者数据 |
| **不影响文件** | `src/data/question-list.json` | 不变 | 问诊数据完全独立 |

#### 5.1.4 关键设计决策

- **不合并 Question 和 Appointment 为统一实体**：两者生命周期、状态机、业务逻辑差异大，保持独立更清晰
- **Consultation.vue 采用 Tabs 模式扩展**：在现有「我的问题」旁新增「我的预约」Tab，而非新建页面，减少导航层级
- **DoctorRoom.vue 采用分区扩展**：在「待响应问题」「已解答问题」下方追加「预约管理」区块，与现有布局一致

---

### 5.2 数据模型设计

#### 5.2.1 复用现有类型

**Patient 类型** — 直接复用，无需修改：

```typescript
// src/store/index.ts 中已有定义
interface Patient {
  id: string;        // 如 "patient001"
  name: string;      // 如 "赵明"
  birthday: string;  // 如 "1985-03-15"
  phone: string;     // 如 "138****1234"
  gender: string;    // 如 "男"
}
```

**Doctor 类型** — 直接复用，无需修改：

```typescript
// src/store/index.ts 中已有定义
interface Doctor {
  id: string;          // 如 "doc001"
  username: string;    // 如 "dr-zhang-wei"
  password: string;
  name: string;        // 如 "张伟医生"
  title: string;       // 如 "主任医师"
  department: string;  // 如 "心内科"  ← 预约时作为科室来源
  avatar: string;
  experience: string;
  specialties: string[];
  isActive: boolean;
}
```

#### 5.2.2 新增 Appointment 类型定义

```typescript
/**
 * 预约实体 - 新增到 src/store/index.ts
 * 与 Question 并列为第二核心业务实体
 */
interface Appointment {
  id: string;              // 主键, 格式 "APT{timestamp}", 如 "APT1740676800000"
  patientId: string;       // 外键 → Patient.id
  patientName: string;     // 冗余字段,避免联表查询
  doctorId: string;        // 外键 → Doctor.id
  doctorName: string;      // 冗余字段
  department: string;      // 就诊科室, 取自 Doctor.department
  appointmentDate: string; // 预约日期, 格式 "YYYY-MM-DD", 如 "2026-05-01"
  timeSlot: string;        // 时段标识, 如 "morning-1"(09:00-09:30), "morning-2"(09:30-10:00)
  timeSlotLabel: string;   // 时段可读名称, 如 "09:00 - 09:30"
  symptoms: string;        // 症状简述
  status: AppointmentStatus;
  createdAt: string;       // 创建时间 ISO 格式
  confirmedAt: string | null;  // 医生确认时间
  cancelledAt: string | null;  // 取消时间
  cancelReason?: string;   // 取消原因(可选)
}

/** 预约状态枚举 */
type AppointmentStatus =
  | 'pending'      // 待确认 - 患者提交后等待医生确认
  | 'confirmed'    // 已确认 - 医生确认预约
  | 'completed'    // 已完成 - 就诊结束
  | 'cancelled';   // 已取消 - 患者取消或医生拒绝
```

#### 5.2.3 新增 TimeSlot 排班时段配置

```typescript
/**
 * 排班时段模板 - 用于生成医生的可用时段
 * MVP 阶段硬编码,后续可迁移至 JSON 配置
 */
interface TimeSlotTemplate {
  key: string;       // 唯一标识, 如 "morning-1"
  label: string;     // 展示文本, 如 "09:00 - 09:30"
  period: 'morning' | 'afternoon'; // 所属时段组
  startHour: number; // 开始小时
  startMinute: number; // 开始分钟
  endHour: number;   // 结束小时
  endMinute: number; // 结束分钟
  maxCapacity: number; // 该时段最大预约人数, 默认为 3
}
```

默认排班模板（每周一至周五）：
```
上午 (Morning):
  morning-1:  09:00 - 09:30  (上限 3 人)
  morning-2:  09:30 - 10:00  (上限 3 人)
  morning-3:  10:00 - 10:30  (上限 3 人)

下午 (Afternoon):
  afternoon-1: 14:00 - 14:30  (上限 3 人)
  afternoon-2: 14:30 - 15:00  (上限 3 人)
  afternoon-3: 15:00 - 15:30  (上限 3 人)
```

#### 5.2.4 State 结构变更

```typescript
// 修改前
interface State {
  doctors: Doctor[];
  patients: Patient[];
  questions: Question[];
  currentDoctor: Doctor | null;
  currentPatient: Patient | null;
}

// 修改后（新增 appointments 字段）
interface State {
  doctors: Doctor[];
  patients: Patient[];
  questions: Question[];
  appointments: Appointment[];       // ← 新增
  currentDoctor: Doctor | null;
  currentPatient: Patient | null;
}
```

#### 5.2.5 新增数据文件

**`src/data/appointment-list.json`**：初始预约数据（MVP 可为空数组或包含少量示例数据）

```json
[
  {
    "id": "APT20260427001",
    "patientId": "patient001",
    "patientName": "赵明",
    "doctorId": "doc001",
    "doctorName": "张伟医生",
    "department": "心内科",
    "appointmentDate": "2026-05-02",
    "timeSlot": "morning-1",
    "timeSlotLabel": "09:00 - 09:30",
    "symptoms": "近期胸闷气短,想做个详细检查",
    "status": "confirmed",
    "createdAt": "2026-04-27T10:00:00",
    "confirmedAt": "2026-04-27T11:00:00",
    "cancelledAt": null,
    "cancelReason": null
  },
  {
    "id": "APT20260427002",
    "patientId": "patient002",
    "patientName": "孙丽",
    "doctorId": "doc002",
    "doctorName": "李娜医生",
    "department": "儿科",
    "appointmentDate": "2026-05-03",
    "timeSlot": "afternoon-2",
    "timeSlotLabel": "14:30 - 15:00",
    "symptoms": "孩子反复咳嗽需要面诊",
    "status": "pending",
    "createdAt": "2026-04-27T14:00:00",
    "confirmedAt": null,
    "cancelledAt": null,
    "cancelReason": null
  }
]
```

---

### 5.3 需要添加的 Store 新接口

在 `src/store/index.ts` 的 `store` 对象中新增以下方法：

```typescript
// ════════════════════════════════════════════
// 新增接口清单
// ════════════════════════════════════════════

// --- 基础 CRUD ---

/** 创建预约 */
createAppointment(data: CreateAppointmentParams): Appointment;

/** 获取某医生的所有预约 */
getAppointmentsByDoctor(doctorId: string): Appointment[];

/** 获取某患者的所有预约 */
getAppointmentsByPatient(patientId: string): Appointment[];

/** 获取单个预约详情 */
getAppointmentById(id: string): Appointment | undefined;

// --- 状态流转 ---

/** 医生确认预约 */
confirmAppointment(appointmentId: string): void;

/** 医生拒绝预约 */
rejectAppointment(appointmentId: string, reason?: string): void;

/** 患者取消预约 */
cancelAppointment(appointmentId: string, reason?: string): void;

/** 标记预约已完成 */
completeAppointment(appointmentId: string): void;

// --- 查询辅助 ---

/** 获取医生在某日期的某时段已有预约数 */
getAppointmentCountForSlot(doctorId: string, date: string, timeSlot: string): number;

/** 判断某时段是否已满 */
isTimeSlotFull(doctorId: string, date: string, timeSlot: string): boolean;

/** 获取医生今日预约列表 */
getTodayAppointments(doctorId: string): Appointment[];

/** 获取医生待处理预约（pending 状态） */
getPendingAppointments(doctorId: string): Appointment[];

// --- 排班 ---

/** 获取未来 N 天的排班日程（含可用时段信息） */
getDoctorSchedule(doctorId: string, days?: number): ScheduleDay[];

/** 获取所有可用时段模板 */
getTimeSlotTemplates(): TimeSlotTemplate[];

// --- 统计（扩展现有 getStatistics） ---

/** 更新后的 getStatistics 追加预约统计字段 */
getStatistics(): {
  totalDoctors: number;
  totalQuestions: number;
  activeSessions: number;
  totalSessions: number;
  totalAppointments: number;       // ← 新增
  pendingAppointments: number;     // ← 新增
  todayAppointments: number;       // ← 新增
};
```

#### 辅助类型定义

```typescript
/** 创建预约参数 */
interface CreateAppointmentParams {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentDate: string;
  timeSlot: string;
  timeSlotLabel: string;
  symptoms: string;
}

/** 单日排班信息 */
interface ScheduleDay {
  date: string;           // "YYYY-MM-DD"
  weekday: string;        // "周一"、"周二"...
  isWorkday: boolean;     // 是否工作日(周一至周五)
  timeSlots: SlotInfo[];  // 当天各时段详情
}

/** 时段可用性信息 */
interface SlotInfo {
  key: string;            // "morning-1"
  label: string;          // "09:00 - 09:30"
  period: 'morning' | 'afternoon';
  bookedCount: number;    // 已预约数量
  maxCapacity: number;    // 上限
  available: boolean;     // 是否仍可预约
}
```

---

### 5.4 前端页面设计

#### 5.4.1 患者端页面 A：独立预约挂号页 (`src/views/Appointment.vue`)

**路由**: `/appointment`
**权限**: 弱门控（同 Consultation.vue），未验证时显示验证表单

**页面布局**:

```
╔══════════════════════════════════════════════════════════════╗
║  [预约挂号]                                          切换用户║
╠══════════════════════════════════════════════════════════════╣
║                                                           ║
║  ┌─ 步骤 1: 选择医生 ──────────────────────────────────┐   ║
║  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │   ║
║  │  │ 张伟 │ │ 李娜 │ │ 王强 │ │ 陈杰 │ ...         │   ║
║  │  │ 心内科│ │ 儿科 │ │ 骨科 │ │消化内科│            │   ║
║  │  └──────┘ └──────┘ └──────┘ └──────┘             │   ║
║  └───────────────────────────────────────────────────┘   ║
║                                                           ║
║  ┌─ 步骤 2: 选择日期和时段 ──────────────────────────┐   ║
║  │                                                     │   ║
║  │  ◀ 4月27日 ▶                                        │   ║
║  │  ┌──────────────────────────────────────────┐     │   ║
║  │  │ 上午                                     │     │   ║
║  │  │  [✓] 09:00-09:30  剩余2个号             │     │   ║
║  │  │  [✓] 09:30-10:00  剩余3个号             │     │   ║
║  │  │  [✗] 10:00-10:30  已约满                │     │   ║
║  │  │                                         │     │   ║
║  │  │ 下午                                     │     │   ║
║  │  │  [✓] 14:00-14:30  剩余3个号             │     │   ║
║  │  │  [✓] 14:30-15:00  剩余1个号             │     │   ║
║  │  │  [✓] 15:00-15:30  剩余3个号             │     │   ║
║  │  └──────────────────────────────────────────┘     │   ║
║  └───────────────────────────────────────────────────┘   ║
║                                                           ║
║  ┌─ 步骤 3: 填写症状描述 ──────────────────────────┐   ║
║  │  请简要描述您的症状...                             │   ║
║  │  ┌──────────────────────────────────────────┐   │   ║
║  │  │                                          │   │   ║
║  │  └──────────────────────────────────────────┘   │   ║
║  │                                    [提交预约]  │   ║
║  └───────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════╝
```

**使用的关键 Ant Design Vue 组件**：
- `a-steps` 或分段标题展示流程进度
- `a-card` / `a-card-grid` 医生选择卡片
- `a-date-picker` 日期选择（限制为未来 7 天的工作日）
- `a-radio-group` 或可点击时段卡片选择时段
- `a-textarea` 症状输入
- `a-button` 提交按钮
- `a-tag` 显示剩余号数/已约满状态
- `a-alert` 操作结果提示

**交互逻辑**：
1. 页面加载 → 检查 `currentPatient` 是否存在 → 不存在则显示验证表单（复用 Consultation.vue 的验证逻辑）
2. 选择医生 → 自动加载该医生的排班时段
3. 切换日期 → 刷新该日的时段可用性（根据已预约数动态计算）
4. 选择时段 → 高亮选中态，显示已选信息摘要
5. 填写症状 → 校验必填
6. 提交 → 调用 `store.createAppointment()` → 成功弹窗展示预约详情（编号、时间等）

---

#### 5.4.2 患者端页面 B：Consultation.vue 扩展 — 「我的预约」标签

**位置**: `src/views/Consultation.vue` 的 `.questions-section` 区域改为 Tabs 布局

**变更方式**：将原有的「我的问题」单区块替换为 `a-tabs` 组件：

```
原有:
  ┌─ 我的问题 ──────────────┐
  │ [+] 提交问题             │
  │ 问题卡片列表...          │
  └─────────────────────────┘

变更为:
  ┌─ [我的问题] [我的预约] ──┐  ← a-tabs
  │ Tab 1: 我的问题          │
  │   [+] 提交问题           │  ← 原有内容移入 Tab 1
  │   问题卡片列表...        │
  │                          │
  │ Tab 2: 我的预约          │
  │   预约记录列表...        │  ← 新增内容
  └──────────────────────────┘
```

**Tab 2「我的预约」内容设计**：

| 字段 | 展示方式 | 说明 |
|------|----------|------|
| 预约编号 | `a-descriptions-item` 或 Card 标题 | `id` 字段 |
| 医生姓名 | 卡片头部 | `doctorName` + `department` |
| 科室 | Tag | `department` |
| 预约时间 | 大字突出显示 | `appointmentDate` + `timeSlotLabel` |
| 状态 | `a-tag` 颜色编码 | pending=橙, confirmed=绿, completed=蓝, cancelled=灰 |
| 症状描述 | 正文 | `symptoms` |
| 提交时间 | 小字灰色 | `createdAt` |
| 操作按钮 | 条件渲染 | pending/confirmed 状态显示「取消预约」按钮；cancelled 显示取消原因 |

**取消预约交互**：
1. 点击「取消预约」→ 弹出 `a-modal` 二次确认
2. 确认后调用 `store.cancelAppointment(id)`
3. 业务规则校验：距离预约时间 < 24 小时时提示「距就诊不足 24 小时，无法取消」

---

#### 5.4.3 医生端页面：DoctorRoom.vue 扩展 — 「预约管理」区域

**位置**: 在 `DoctorRoom.vue` 的 `.answered-section` 区块之后新增 `.appointment-section`

**布局设计**：

```
╔═════════════════════════════════════════════════════════╗
║  张伟医生的诊室                    [复制链接] [退出登录]  ║
╠═════════════════════════════════════════════════════════╣
║  诊室URL: ...                                             ║
╠═════════════════════════════════════════════════════════╣
║  待响应问题 (N)                            [刷新]        ║
║  ┌ 问题卡片... ┐                                           ║
║  └─────────────┘                                           ║
╠═════════════════════════════════════════════════════════╣
║  已解答问题 (N)                                            ║
║  ┌ 折叠面板... ┐                                           ║
║  └─────────────┘                                           ║
╠═════════════════════════════════════════════════════════╣  ← 新增区域
║  预约管理                                                   ║
║  ┌ 待处理预约 (N) ─────────────────────────────────────┐  ║
║  │  ┌ 预约卡 ─────────────────────────────────────┐    │  ║
║  │  │ 患者: 赵明 | 日期: 05-02 | 时段: 09:00-09:30│    │  ║
║  │  │ 症状: 近期胸闷气短...                        │    │  ║
║  │  │              [确认预约] [拒绝]               │    │  ║
║  │  └─────────────────────────────────────────────┘    │  ║
║  └────────────────────────────────────────────────────┘  ║
║  ┌ 已确认预约 (N) ─────────────────────────────────────┐  ║
║  │  a-table / 时间线样式展示                           │  ║
║  │  05-02(周五) 09:00  赵明  [完成]                   │  ║
║  │  05-05(周一) 14:30  孙丽  [完成]                   │  ║
║  └────────────────────────────────────────────────────┘  ║
╚═════════════════════════════════════════════════════════╝
```

**子区域说明**：

**① 待处理预约区**（对应 `store.getPendingAppointments(doctorId)`）：
- 使用 Card 列表形式（与上方「待响应问题」视觉一致）
- 每个 Card 包含：患者名、预约日期+时段、症状摘要
- 操作按钮：「确认预约」（调用 `confirmAppointment`）、「拒绝」（调用 `rejectAppointment`，弹出 Modal 要求填写拒绝原因）
- 确认/拒绝后提供 `message.success/error` 反馈

**② 已确认预约区**（筛选 `status === 'confirmed'` 的预约）：
- 使用紧凑的 Table 或 Timeline 视图
- 列：日期、时段、患者名、状态操作
- 「完成」按钮调用 `completeAppointment`
- 空状态使用 `a-empty` 占位

**③ 拒绝交互 Modal**：
- 医生点击「拒绝」→ 弹出 Modal
- 必填项：拒绝原因（下拉选择：号源不足 / 时间冲突 / 其他 + 自定义输入）
- 确认后调用 `rejectAppointment(id, reason)`

---

#### 5.4.4 导航入口变更

**AppHeader.vue 导航栏变更**：

```
原有菜单:
  [首页] [问诊] [医生] [关于]

变更为:
  [首页] [问诊] [挂号] [医生] [关于]
               ↑ 新增 menu-item
```

- 新增 `<a-menu-item key="appointment">`，图标建议使用 `CalendarOutlined`
- `watch` 路由变化中增加 `/appointment` 分支
- 点击导航至 `/appointment`

**Home.vue Hero 区域变更**：

```
原有 hero-actions:
  [立即问诊] [查看医生]

变更为:
  [立即问诊] [预约挂号] [查看医生]
               ↑ 新增按钮
```

- 新增按钮 `type="default"` 或 `type="primary"` ghost 风格（与「立即问诊」区分）
- 点击跳转 `/appointment`

**Home.vue 统计卡片变更**：

```
原有 4 个卡片:
  专业医生 | 问题总数 | 待响应问题 | 在线诊室

变更为 5 个卡片（或替换一个）:
  专业医生 | 问题总数 | 预约总数 | 待响应问题 | 在线诊室
                     ↑ 新增
```

- 新增第 5 个统计卡片（或替换最不重要的一个），展示 `statistics.totalAppointments`
- 图标建议使用 `CalendarOutlined`，配色使用新的渐变色区分

---

### 5.5 依赖关系汇总

| 依赖 | 类型 | 版本要求 | 用途 |
|------|------|----------|------|
| `vue` | 外部 peerDep | ^3.5.10 | Composition API / reactive / computed |
| `vue-router` | 内部 | ^4.6.3 | 新增路由 `/appointment` |
| `ant-design-vue` | 外部 dep | ^4.2.6 | DatePicker, Tabs, Table, Tag, Modal, Card, Steps, Badge, Descriptions, Alert, Empty, Radio, Collapse, Timeline 等 |
| `dayjs` | 外部 dep | ^1.11.19 | 日期计算、格式化、工作日判断 |
| `@ant-design/icons-vue` | 外部 dep | 同步 antd | CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined 等 |
| `src/store/index.ts` | 内部 | 当前文件 | 扩展 Appointment 类型和 Store 方法 |
| `src/router/index.ts` | 内部 | 当前文件 | 注册新路由 |
| `src/views/Consultation.vue` | 内部 | 当前文件 | 扩展 Tabs 布局 |
| `src/views/DoctorRoom.vue` | 内部 | 当前文件 | 扩展预约管理区 |
| `src/components/AppHeader.vue` | 内部 | 当前文件 | 新增导航项 |
| `src/views/Home.vue` | 内部 | 当前文件 | 新增入口按钮和统计 |
| TypeScript | 外部 peerDep | ^5.5.3 | 类型安全 |

### 5.6 技术约束

- **数据持久化**：本地 JSON (`src/data/appointment-list.json`) + 内存 reactive 状态（与现有方案完全一致）
- **无真实后端 API**：所有 CRUD 操作均为前端内存模拟，刷新后动态数据丢失
- **TypeScript 严格模式**：必须兼容，新接口全部标注完整类型
- **组件规范**：全部使用 `<script setup lang="ts">` + Composition API
- **样式规范**：scoped CSS，变量命名遵循 BEM 风格参考现有组件
- **排班规则**：前端硬编码模板（周一至周五出诊），不支持自定义排班配置

## 6. 成功标准

- [ ] 患者可通过 UI 完成完整的预约提交流程
- [ ] 医生可在诊室中查看和处理预约
- [ ] 患者可在门户中查看和取消预约记录
- [ ] 首页提供预约挂号入口
- [ ] 所有表单具备完善的校验机制
- [ ] 无 TypeScript 类型错误
- [ ] 代码符合项目现有的编码风格和架构规范

## 7. 任务分解原则

### 7.1 粒度控制
- 每个任务控制在 1-2 小时工作量（AI 模型约 5-10 分钟）
- 任务聚焦单一职责

### 7.2 独立性
- 尽量减少任务间依赖，支持并行执行
- 核心依赖链：数据模型 → Store → 视图页面 → 功能集成

### 7.3 可测试性
- 每个任务有明确的交付物和验收标准
- 可独立验证功能完整性

### 7.4 任务类别
- 数据模型设计与初始化
- 状态管理逻辑实现
- UI 页面开发
- 路由与导航集成
- 功能联调测试

### 7.5 任务数量限制
- 本功能的理想任务数 ≤ 10 个

## 8. 实现备注

1. **排班模拟策略**：由于无后端支持，医生排班采用前端硬编码模板生成（每周一至周五，每天上午 3 个时段 + 下午 3 个时段）
2. **预约 ID 格式**：`APT` + 时间戳，如 `APT1740676800000`
3. **状态流转图**：
   ```
   待确认(PENDING) → 已确认(CONFIRMED) → 已完成(COMPLETED)
                    ↘ 已取消(CANCELLED)
   ```
4. **时间处理**：统一使用 dayjs，格式遵循项目现有约定（YYYY-MM-DD HH:mm）
5. **与现有咨询功能的关系**：预约挂号是独立于在线问诊的新功能模块，但共享患者身份验证流程

## 9. 风险与应对

### 风险 1：预约冲突处理复杂度
- **描述**：多患者同时预约相同时段可能导致并发问题
- **影响**: 中
- **应对**: MVP 阶段采用乐观锁策略（先到先得），后续接入后端后使用数据库事务保证一致性

### 风险 2：排班灵活性不足
- **描述**：硬编码排班模板可能不满足实际场景
- **影响**: 低
- **应对**: 设计时可配置化的数据结构，MVP 阶段使用固定模板快速上线

### 风险 3：与现有代码耦合风险
- **描述**：修改 Store 可能影响现有问诊功能
- **影响**: 中
- **应对**：采用增量式修改，新功能独立命名空间，确保不影响现有接口签名

## 10. 附录

### 10.1 参考文档
- 项目上下文索引：`.asdm/contexts/index.md`
- 系统架构文档：`.asdm/contexts/architecture.md`
- 数据模型文档：`.asdm/contexts/data-models.md`
- 现有 Store 实现：`src/store/index.ts`
- 路由配置：`src/router/index.ts`

### 10.2 术语表
| 术语 | 定义 |
|------|------|
| 预约挂号 | 患者在线预约医生线下门诊时段的服务 |
| 排班 | 医生的出诊时间段安排 |
| 时段 | 一个具体的可预约时间单元（如 9:00-9:30） |
| 预约状态 | 预约的生命周期状态（待确认/已确认/已完成/已取消） |

---

*本文档由 PRD Builder 自动生成，基于 feature-prd-spec.md 模板*
