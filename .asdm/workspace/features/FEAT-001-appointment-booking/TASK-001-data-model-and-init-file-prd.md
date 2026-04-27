# Task PRD: 创建预约数据模型和初始数据文件

**Feature ID**: FEAT-001
**Feature Name**: appointment-booking
**Task ID**: TASK-001
**Created Date**: 2026-04-27
**Status**: DONE
**Language**: zh-CN

## 1. 任务概述

### 1.1 任务摘要
创建预约功能的初始数据文件 `src/data/appointment-list.json`，定义 Appointment 实体的 JSON 数据结构并提供示例数据。这是整个预约挂号功能的数据基础，后续 Store 层和所有页面都依赖此数据源。

### 1.2 任务目标
- 新建 `src/data/appointment-list.json` 数据文件
- 数据结构严格遵循 Feature PRD 第 5.2.2 节的 `Appointment` 接口定义（15 字段）
- 提供 2-3 条覆盖不同状态、不同医生、不同日期的示例数据

### 1.3 关联的功能需求
- **Feature Requirement**: REQ-001 — 预约数据模型设计
- **Related User Story**: 故事 1, 2, 3, 4 (全部依赖此数据层)

## 2. 详细需求

### 2.1 功能需求
- 创建 `src/data/appointment-list.json`，内容为合法的 JSON 数组
- 每条记录包含以下 15 个字段：
  | 字段 | 类型 | 示例值 | 说明 |
  |------|------|--------|------|
  | id | string | `"APT20260501001"` | 预约唯一编号 |
  | patientId | string | `"patient001"` | 关联患者ID |
  | patientName | string | `"赵明"` | 冗余患者姓名 |
  | doctorId | string | `"doc001"` | 关联医生ID |
  | doctorName | string | `"张伟医生"` | 冗余医生姓名 |
  | department | string | `"心内科"` | 就诊科室 |
  | appointmentDate | string | `"2026-05-02"` | 预约日期 YYYY-MM-DD |
  | timeSlot | string | `"morning-1"` | 时段标识 |
  | timeSlotLabel | string | `"09:00 - 09:30"` | 时段可读名称 |
  | symptoms | string | `"近期胸闷气短..."` | 症状简述 |
  | status | string | `"confirmed"` | pending/confirmed/completed/cancelled |
  | createdAt | string | `"2026-04-27T10:00:00Z"` | ISO 时间戳 |
  | confirmedAt | string or null | `"2026-04-27T11:00:00Z"` | 确认时间 |
  | cancelledAt | string or null | null | 取消时间 |
  | cancelReason | string or null | null | 取消原因 |

### 2.2 技术需求
- 文件路径：`src/data/appointment-list.json`
- 编码格式：UTF-8
- 必须为合法 JSON（可通过 `JSON.parse()` 验证）
- 参照现有数据文件的格式风格：`src/data/question-list.json`

### 2.3 约束与限制
- 示例数据的 patientId / doctorId 必须与现有 `patient-user.json` 和 `doctor-user-list.json` 中的记录对应
- department 字段必须匹配对应医生的 department 值
- appointmentDate 应使用未来日期（相对于当前时间的未来几天）

### 2.4 安全要求 (Security Requirements)

#### 2.4.1 数据隐私保护
| 安全项 | 要求 | 原因 |
|--------|------|------|
| **敏感字段脱敏** | 示例数据中如涉及 phone 等字段必须使用脱敏格式如 `138****1234`，禁止使用真实手机号 | 医疗场景涉及患者 PII（个人身份信息），即使为示例数据也应建立正确的脱敏规范 |
| **症状描述匿名化** | `symptoms` 字段的示例内容不得包含可识别真实个人的具体信息（如真实姓名+具体住址+罕见病组合） | 防止示例数据被误用于隐私推断 |
| **ID 规范** | `id` 字段格式使用 `APT{YYYYMMDD}{序号}` 而非自增整数，避免暴露数据总量 | 防止通过 ID 推断系统预约量 |

#### 2.4.2 数据完整性约束
| 安全项 | 要求 |
|--------|------|
| **外键引用有效性** | 所有 `patientId` 必须在 `patient-user.json` 中存在，所有 `doctorId` 必须在 `doctor-user-list.json` 中存在；不允许悬空引用 |
| **时间戳合法性** | `createdAt` 必须 ≤ 当前时间；`confirmedAt ≥ createdAt`（当非 null 时）；`cancelledAt ≥ createdAt`（当非 null 时） |
| **状态一致性** | 当 `status = 'confirmed'` 时 `confirmedAt` 不可为 null；当 `status = 'cancelled'` 时 `cancelledAt` 和 `cancelReason` 应有值 |
| **枚举值限制** | `status` 字段仅允许 `pending \| confirmed \| completed \`cancelled` 四个值之一 |

#### 2.4.3 文件安全性
| 安全项 | 要求 |
|--------|------|
| **无注释** | JSON 文件中不得包含注释（标准 JSON 不支持注释，避免解析器差异导致信息泄露） |
| **无内嵌脚本** | 严禁在 JSON 值中嵌入 `<script>`、`javascript:` 等 XSS 载荷字符串（防御性编程：假设未来可能渲染到 DOM） |
| **编码规范** | 文件必须使用 UTF-8 编码且无 BOM |

## 3. 实施方案

### 3.1 推荐方案
直接新建 JSON 文件，手动编写示例数据。

### 3.2 实施步骤
1. 参照 `src/data/question-list.json` 的数组结构风格
2. 在 `src/data/` 目录下新建 `appointment-list.json`
3. 编写 2-3 条示例预约记录：
   - 第 1 条：status=confirmed，patient001→doc001，05-02 上午
   - 第 2 条：status=pending，patient002→doc002，05-03 下午
   - （可选）第 3 条：status=cancelled，patient003→doc003，含取消原因
4. 使用 JSON linter 或编辑器验证格式正确性

### 3.3 技术考量
- 保持与现有 JSON 数据文件一致的缩进风格（2 空格缩进）
- id 字段使用有意义的格式便于调试（如 APT + 日期 + 序号）
- 确保所有必填字段不为空字符串或 null（createdAt 除外）

### 3.4 项目上下文参考
- `.asdm/contexts/index.md`: 了解现有数据文件位置和命名规范
- `.asdm/contexts/architecture.md`: 理解四层数据架构中 Data 层的角色
- `src/data/question-list.json`: 参照现有的 JSON 数据文件格式
- `src/data/patient-user.json`: 确保 patientId 引用有效
- `src/data/doctor-user-list.json`: 确保 doctorId 和 department 引用一致

## 4. 验收标准

### 4.1 主要标准
- **标准 1**: `src/data/appointment-list.json` 文件存在且可被 import 加载
  - 验证方式：在 TypeScript 中 `import data from '../data/appointment-list.json'` 无报错
  - **验证工具**: `npx vue-tsc --noEmit` 或 `npm run build` 编译通过
- **标准 2**: 每条记录完整包含全部 15 个字段，类型正确
  - 验证方式：逐条检查字段完整性
  - **验证工具**: 人工检查 + JSON Schema 校验
- **标准 3**: 至少包含 confirmed 和 pending 两种状态的示例
  - 验证方式：统计 status 字段值的分布
  - **验证工具**: 人工检查
- **标准 4**: 外键引用一致性（patientId、doctorId 匹配现有数据）
  - 验证方式：交叉比对 patient-user.json 和 doctor-user-list.json
  - **验证工具**: 人工检查

### 4.2 边界情况
- cancelledAt 和 confirmedAt 可以为 null（当 status 不是 confirmed/cancelled 时）
- cancelReason 为可选字段，非取消状态时可为 null

### 4.3 负面测试
- 文件不应包含任何语法错误（如缺少逗号、多余逗号、未闭合括号）
- 不应包含注释（标准 JSON 不支持注释）

## 5. 依赖关系

### 5.1 任务依赖
- **Depends on**: 无（起始任务）
- **Blocks**: TASK-002 (Store 层数据初始化依赖此文件)

### 5.2 外部依赖
- 无外部依赖

### 5.3 前置条件
- 项目已初始化（已有 src/data/ 目录和其他 JSON 数据文件作为参照）

## 6. 工作量估算

| 维度 | 估算 |
|------|------|
| **预估工时** | 0.5 小时 |
| **复杂度** | 低 |
| **风险** | 低 |

## 7. 测试策略

### 7.1 自动化验证
- **构建验证**: `npm run build` 确认 JSON 文件能被 TypeScript 正确导入
- **Type 检查**: `npx vue-tsc --noEmit` 确认无类型错误
- **退出标准**: 所有命令 exit code = 0

### 7.2 手动测试
- 打开 JSON 文件确认格式化显示正常
- 用在线 JSON 验证器检查合法性

## 8. 交付物

- [x] `src/data/appointment-list.json` — 预约初始数据文件

---

*本 Task PRD 由 PRD Builder 基于 task-prd-spec.md 模板生成*
