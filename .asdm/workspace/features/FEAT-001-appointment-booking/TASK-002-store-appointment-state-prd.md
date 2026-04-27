# Task PRD: 扩展 Store — 预约类型定义与核心方法实现

**Feature ID**: FEAT-001
**Feature Name**: appointment-booking
**Task ID**: TASK-002
**Created Date**: 2026-04-27
**Status**: DONE
**Language**: zh-CN

## 1. 任务概述

### 1.1 任务摘要
在 `src/store/index.ts` 中扩展状态管理，添加 Appointment 相关的类型定义、State 字段和 16 个业务方法。这是预约功能的核心业务逻辑层，所有视图组件通过调用这些方法操作预约数据。

### 1.2 任务目标
- 新增 6 个 TypeScript 接口/类型别名定义
- 扩展 State 接口新增 appointments 字段
- 初始化 appointments 数据（从 JSON 导入）
- 实现 16 个 Store 方法（CRUD + 状态流转 + 查询辅助 + 排班 + 统计）
- 更新 getStatistics() 追加 3 个预约统计字段
- 确保不破坏现有问诊功能的方法签名

### 1.3 关联的功能需求
- **Feature Requirement**: REQ-002 — Store 层预约状态管理
- **Related User Story**: 故事 1, 2, 3, 4 (全部依赖 Store)

## 2. 详细需求

### 2.1 功能需求

**A. 类型定义（6 个）**：

```typescript
// 预约状态枚举
type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// 预约实体接口
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentDate: string;   // YYYY-MM-DD
  timeSlot: string;          // 如 "morning-1"
  timeSlotLabel: string;     // 如 "09:00 - 09:30"
  symptoms: string;
  status: AppointmentStatus;
  createdAt: string;         // ISO 格式
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason?: string;
}

// 创建预约参数
interface CreateAppointmentParams {
  patientId: string; patientName: string; doctorId: string;
  doctorName: string; department: string; appointmentDate: string;
  timeSlot: string; timeSlotLabel: string; symptoms: string;
}

// 单日排班信息
interface ScheduleDay {
  date: string; weekday: string; isWorkday: boolean; timeSlots: SlotInfo[];
}

// 时段可用性
interface SlotInfo { key: string; label: string; period: 'morning' | 'afternoon';
  bookedCount: number; maxCapacity: number; available: boolean; }

// 时段模板
interface TimeSlotTemplate {
  key: string; label: string; period: 'morning' | 'afternoon';
  startHour: number; startMinute: number; endHour: number; endMinute: number;
  maxCapacity: number;
}
```

**B. State 扩展**：在 State interface 中增加 `appointments: Appointment[]`

**C. 初始化**：import appointmentData 并赋值给 state.appointments

**D. 16 个 Store 方法**（按分组）：

*基础 CRUD（4）*:
| 方法签名 | 说明 |
|----------|------|
| `createAppointment(params: CreateAppointmentParams): Appointment` | 创建新预约，自动生成 id+createdAt，校验时段未满员 |
| `getAppointmentsByDoctor(doctorId: string): Appointment[]` | 按医生筛选 |
| `getAppointmentsByPatient(patientId: string): Appointment[]` | 按患者筛选 |
| `getAppointmentById(id: string): Appointment \| undefined` | 按 id 查找 |

*状态流转（4）*:
| 方法签名 | 说明 |
|----------|------|
| `confirmAppointment(id: string): void` | 状态→confirmed，设置 confirmedAt |
| `rejectAppointment(id: string, reason?: string): void` | 状态→cancelled，设置 cancelledAt+cancelReason |
| `cancelAppointment(id: string, reason?: string): void` | 状态→cancelled，含<24h不可取消校验 |
| `completeAppointment(id: string): void` | 状态→completed |

*查询辅助（5）*:
| 方法签名 | 说明 |
|----------|------|
| `getAppointmentCountForSlot(doctorId, date, timeSlot): number` | 统计某医生某时段已约数 |
| `isTimeSlotFull(doctorId, date, timeSlot): boolean` | 是否≥maxCapacity(3) |
| `getTodayAppointments(doctorId: string): Appointment[]` | 今日预约列表 |
| `getPendingAppointments(doctorId: string): Appointment[]` | 待处理预约 |
| `getDoctorSchedule(doctorId, days?: number): ScheduleDay[]` | 生成N天排班日程 |

*排班（1）*:
| 方法签名 | 说明 |
|----------|------|
| `getTimeSlotTemplates(): TimeSlotTemplate[]` | 返回硬编码6个时段模板 |

*统计修改（1）*:
| 方法签名 | 说明 |
|----------|------|
| `getStatistics()` | 追加 totalAppointments, pendingAppointments, todayAppointments |

### 2.2 技术需求
- 修改文件：`src/store/index.ts`
- 使用 Vue 3 reactive API
- 使用 dayjs 进行日期计算
- 全部方法挂载到 export const store 对象上
- 所有新类型必须 export 供其他组件使用

### 2.3 约束与限制
- **不得修改或删除**现有 Doctor/Patient/Question 类型和现有 store 方法签名
- 新增代码放在现有代码之后，用清晰的注释分隔
- isTimeSlotFull 的 maxCapacity 固定为 3（MVP 阶段）
- getDoctorSchedule 仅周一至周五出诊，周末 isWorkday=false

### 2.4 安全要求 (Security Requirements)

#### 2.4.1 输入验证与净化 (Input Validation & Sanitization)
| 方法 | 安全要求 | 实现方式 |
|------|----------|----------|
| `createAppointment()` | **所有入参必须经过类型和范围校验** | ① `symptoms` 最大长度 500 字符，超出则截断并记录警告；② `appointmentDate` 必须是有效 YYYY-MM-DD 格式且 ≥ 今天；③ `timeSlot` 必须匹配已定义的时段模板 key 列表；④ `doctorId` 必须对应存在的医生；⑤ 对 `symptoms` 执行 HTML 转义（替换 `<>&"'` 为实体）防止 Store 层存储 XSS 载荷 |
| `cancelAppointment()` | **调用者身份校验** | 内部应验证操作者身份（当前患者 ID == appointment.patientId），防止越权取消他人预约。MVP 阶段由视图层负责传参正确性，Store 层添加 defensive check 并在 mismatch 时 throw Error |
| `confirmAppointment()` | **操作者权限校验** | 内部应验证当前登录医生 ID == appointment.doctorId，防止医生确认/拒绝不属于自己诊室的预约 |
| `rejectAppointment()` | **拒绝原因长度限制** | `reason` 参数最大 200 字符，超长截断；对 reason 同样执行 HTML 转义 |
| `getAppointmentById()` | **ID 注入防护** | 入参仅接受 string 类型，内部不做 `eval()` 或 `new Function()` 等危险操作；返回 undefined 而非抛异常（避免信息泄露） |

#### 2.4.2 业务逻辑安全 (Business Logic Security)
| 安全风险 | 防护措施 |
|----------|----------|
| **超时预约 (TOCTOU)** | `createAppointment` 内部执行"二次校验"：先检查 `isTimeSlotFull` → 再创建。在高并发场景下可能出现竞态条件，MVP 阶段在前端加 `submitting` 锁防重复点击即可 |
| **状态机非法跃迁** | 每个状态流转方法必须检查当前状态是否合法：`confirmAppointment` 仅允许 `pending → confirmed`；`cancelAppointment` 仅允许 `pending|confirmed → cancelled`；`completeAppointment` 仅允许 `confirmed → completed`。非法状态转换静默忽略或抛出明确错误 |
| **24h 取消窗口强制执行** | `cancelAppointment` 必须计算距预约时间的精确小时差，< 24h 时严格拒绝并给出明确提示，不允许绕过 |
| **时段容量硬上限** | `isTimeSlotFull` 的比较逻辑：统计 `status !== 'cancelled'` 的同医生+同日期+同时段预约数，≥ `maxCapacity`(=3) 则返回 true。容量检查不可被前端绕过 |

#### 2.4.3 数据访问控制 (Data Access Control)
| 操作 | 访问控制要求 |
|------|--------------|
| `getAppointmentsByPatient(patientId)` | 返回结果不应包含其他患者的任何预约信息（天然隔离，但需确保方法无侧漏） |
| `getAppointmentsByDoctor(doctorId)` | 返回结果仅包含该医生的预约（天然隔离） |
| `getStatistics()` | 统计数据属于聚合信息，无敏感泄露风险；但注意不要在统计接口中返回单条预约详情 |
| State 初始化 | `import appointmentData from JSON` 的数据直接赋值给 reactive state，确保初始化过程中不会被外部篡改 |

#### 2.4.4 敏感数据处理
| 数据类型 | 处理要求 |
|----------|----------|
| 患者姓名 (patientName) | 冗余存储于 Appointment 中以便展示，但不得用于索引或查询主键（使用 patientId） |
| 症状描述 (symptoms) | 属于医疗敏感信息，Store 层存储时已完成 HTML 转义；传递给组件时保持转义态 |
| 时间戳 (createdAt/confirmedAt/cancelledAt) | 使用 ISO 格式，不含时区偏移的敏感信息 |
| 取消原因 (cancelReason) | 可选填写，存储前截断至 200 字符 + HTML 转义 |

#### 2.4.5 错误处理安全 (Secure Error Handling)
| 场景 | 安全处理方式 |
|------|--------------|
| 传入不存在的 ID | 返回 `undefined` / `null` / 静默失败，**禁止**在错误消息中暴露内部数据结构、堆栈信息或文件路径 |
| 类型错误参数 | 使用 TypeScript 类型守卫进行运行时校验，不合法输入触发 `console.warn` 并返回安全默认值，而非崩溃 |
| 状态转换非法 | 抛出自定义业务异常（如 `throw new Error('Invalid status transition')`），由调用方 catch 并展示用户友好提示 |

## 3. 实施方案

### 3.1 推荐方案
增量式修改：在现有 `src/store/index.ts` 中追加新类型和新方法。

### 3.2 实施步骤
1. 在文件顶部 import 区域新增：
   ```typescript
   import appointmentData from '../data/appointment-list.json';
   import dayjs from 'dayjs';
   ```
2. 在现有 `Question` 接口之后追加 6 个新类型定义
3. 在 `State` 接口中新增 `appointments: Appointment[]` 字段
4. 在 `reactive<State>({...})` 初始化对象中新增 `appointments: appointmentData as Appointment[]`
5. 在 store 对象末尾（`getStatistics` 之后）追加所有新方法
6. 修改 `getStatistics` 方法体，返回对象中追加 3 个预约统计字段

**关键业务逻辑实现要点**：
- `createAppointment`: 先调 `isTimeSlotFull` 校验 → 满则 return null 或 throw；否则构造新对象 push 到 state
- `isTimeSlotFull`: filter 同 doctorId+date+timeSlot 且 status !== 'cancelled' → count ≥ 3
- `cancelAppointment`: 计算 `dayjs(appointmentDate).diff(dayjs(), 'hour')` < 24 则阻止
- `getDoctorSchedule`: 循环未来 N 天，判断 weekday ∈ [1-5]（周一至周五），每天生成 6 个 SlotInfo（3上午+3下午）
- `getTimeSlotTemplates`: 返回静态数组（hardcoded 6 个时段配置）

### 3.3 技术考量
- 使用 `export type` 导出新类型，确保组件可 import
- dayjs 已在项目依赖中，无需安装
- 保持与现有方法的命名风格一致（camelCase 动词开头）
- 所有状态变更直接操作 reactive state 即可触发响应式更新

### 3.4 项目上下文参考
- `src/store/index.ts`: 当前唯一需修改的文件
- `.asdm/contexts/architecture.md`: 四层架构中 Business Logic Layer 的规范
- `src/data/appointment-list.json`: TASK-001 交付的数据源

## 4. 验收标准

### 4.1 主要标准
- **标准 1**: TypeScript 编译无错误
  - 验证方式: `npx vue-tsc --noEmit` 通过
  - **验证工具**: vue-tsc (TypeScript 编译器)
- **标准 2**: `store.state.appointments` 初始化后包含来自 JSON 的数据
  - 验证方式: 浏览器 Console 输入 `window.__vue_app__` 或组件中 console.log 检查
  - **验证工具**: 开发者工具 Console
- **标准 3**: `createAppointment` 能成功创建并 push 到 state
  - 验证方式: 组件中调用后检查 appointments 数组长度+1
  - **验证工具**: 手动测试
- **标准 4**: `confirmAppointment` / `cancelAppointment` 正确更新状态和时间戳
  - 验证方式: 调用后检查对应记录的字段变更
  - **验证工具**: 手动测试
- **标准 5**: `isTimeSlotFull` 在达到 3 人上限时返回 true
  - 验证方式: 构造满员场景测试返回值
  - **验证工具**: 手动测试
- **标准 6**: `getDoctorSchedule` 返回未来 7 天的正确日程（周末无时段）
  - 验证方式: 检查返回数组的长度和 isWorkday 分布
  - **验证工具**: 手动测试
- **标准 7**: `getStatistics()` 返回对象包含 3 个新增预约统计字段且值正确
  - 验证方式: 检查返回对象的属性
  - **验证工具**: 手动测试
- **标准 8**: 现有问诊功能方法（loginDoctor, verifyPatient, addQuestion 等）完全不受影响
  - 验证方式: 现有页面功能回归检查
  - **验证工具**: 浏览器访问 /consultation 和 /doctor/room

### 4.2 边界情况
- createAppointment 当时段满员时的行为（return null 还是 throw？建议 return null 让调用方处理）
- cancelAppointment 当预约已经是 cancelled/completed 状态时应忽略或提示
- confirmAppointment 对非 pending 状态的预约应做防护
- getDoctorSchedule 当 days 参数 ≤ 0 时返回空数组

### 4.3 负面测试
- 传入不存在的 appointmentId 给 confirm/cancel/complete/reject 方法不应崩溃
- 并发场景（快速连续创建同一时段）在 MVP 阶段不做额外锁控制

## 5. 依赖关系

### 5.1 任务依赖
- **Depends on**: TASK-001（需要 appointment-list.json 数据文件存在）
- **Blocks**: TASK-004, TASK-006, TASK-007, TASK-008

### 5.2 外部依赖
- `dayjs` ^1.11.19 (已在 package.json 中)
- TypeScript ^5.5.3
- Vue 3 reactive API

### 5.3 前置条件
- TASK-001 已完成（`src/data/appointment-list.json` 存在）

## 6. 工作量估算

| 维度 | 估算 |
|------|------|
| **预估工时** | 1.5 小时 |
| **复杂度** | 中 |
| **风险** | 中（修改核心 Store 文件） |

## 7. 测试策略

### 7.1 自动化验证
- **构建验证**: `npm run build` 确认编译打包成功
- **Type 检查**: `npx vue-tsc --noEmit` 确认零类型错误
- **退出标准**: exit code = 0

### 7.2 手动测试
- 在浏览器 DevTools Console 中逐一调用各方法验证行为
- 访问现有问诊页面确认无回归问题

## 8. 交付物

- [ ] 修改后的 `src/store/index.ts`（包含 6 个新类型 + 16 个新方法 + State 扩展 + 统计扩展）

---

*本 Task PRD 由 PRD Builder 基于 task-prd-spec.md 模板生成*
