# 工作区上下文索引

## 概览

本文档是 AI 模型理解和操作此工作区的索引与指南。它提供了工作区内容的结构化概览，并引导 AI 模型查找相关上下文。

## 工作区信息

### 基本信息
- **工作区名称**: QA Live Healthcare（在线医疗问诊平台）
- **描述**: 一个基于 Vue 3 + TypeScript + Vite 的在线医疗问诊单页应用，提供患者提问、医生解答的实时问诊服务
- **创建日期**: 2025年
- **最近更新**: 2026-05-08

### 技术栈
- **主要语言**: TypeScript
- **前端框架**: Vue 3.5（Composition API）
- **构建工具**: Vite 5.4
- **UI 组件库**: Ant Design Vue 4.2
- **路由**: Vue Router 4.6（HTML5 History 模式）
- **状态管理**: 自定义响应式 Store（未使用 Vuex/Pinia）
- **日期处理**: Day.js 1.11
- **类型检查**: vue-tsc 2.1
- **后端**: 无（纯前端，数据来源于静态 JSON 文件）

### 业务上下文
- **业务领域**: 在线医疗问诊
- **核心业务流程**:
  1. 患者通过姓名+生日验证身份（首次自动创建账户）
  2. 患者选择在线医生并提交问诊问题
  3. 医生通过用户名+密码登录
  4. 医生查看待回答问题并进行文字回复或标记已口述解答
  5. 患者查看医生的回复
- **业务规则**:
  - 医生有在线/离线状态，只有在线医生可以接受问诊
  - 问题状态分为"待回答"和"已回答"
  - 医生回答方式：文字回复或标记"已口述解答"
  - 所有数据为客户端内存存储，无持久化后端

## 工作区结构

### 文件树及说明
```
qa-live-healthcare/
├── .asdm/                          # ASDM 配置与工具集
│   ├── contexts/                   # 上下文文件（本目录）
│   └── toolsets/                   # 已安装的工具集
│       └── context-builder-7/      # Context Builder 工具集
├── public/                         # 静态资源
│   └── vite.svg                    # Vite 图标（favicon）
├── src/                            # 源代码目录
│   ├── main.ts                     # 应用入口，注册 Ant Design Vue 和路由
│   ├── App.vue                     # 根组件，布局框架（Header + Content + Footer）
│   ├── style.css                   # 全局样式（CSS 自定义属性、基础样式）
│   ├── vite-env.d.ts               # Vite 类型声明
│   ├── assets/                     # 静态资源
│   │   └── vue.svg                 # Vue 图标
│   ├── components/                 # 通用组件
│   │   ├── AppHeader.vue           # 顶部导航栏（Logo + 菜单 + 登录按钮）
│   │   ├── AppFooter.vue           # 底部页脚（品牌信息 + 快捷链接 + 联系方式）
│   │   └── HelloWorld.vue          # ⚠️ 脚手架残留组件（未使用）
│   ├── data/                       # 静态数据文件
│   │   ├── doctor-user-list.json   # 医生用户列表（5名医生）
│   │   ├── patient-user.json       # 患者用户列表（5名患者）
│   │   └── question-list.json      # 问诊问题列表（7条问题）
│   ├── router/                     # 路由配置
│   │   └── index.ts                # Vue Router 路由定义（7条路由）
│   ├── store/                      # 状态管理
│   │   └── index.ts                # 自定义响应式 Store（数据模型 + 业务逻辑）
│   └── views/                      # 页面视图
│       ├── Home.vue                # 首页（平台介绍 + 统计 + 在线诊室）
│       ├── Consultation.vue        # 患者问诊页（身份验证 + 提问 + 查看回复）
│       ├── Doctors.vue             # 医生目录页（所有医生卡片列表）
│       ├── DoctorLogin.vue         # 医生登录页
│       ├── DoctorRoom.vue          # 医生诊室页（待回答/已回答问题管理）
│       └── About.vue               # 关于页面（平台介绍 + 服务流程）
├── index.html                      # HTML 入口
├── vite.config.ts                  # Vite 配置
├── tsconfig.json                   # TypeScript 项目引用配置
├── tsconfig.app.json               # 应用 TypeScript 配置（ES2020, Strict）
├── tsconfig.node.json              # Node 端 TypeScript 配置（ES2022）
├── package.json                    # 项目依赖与脚本
└── .env                            # 环境变量（当前为空）
```

### 关键目录说明
- **`src/store/`**: 核心业务逻辑所在，包含数据模型定义和所有业务方法
- **`src/views/`**: 页面组件，每个视图对应一个路由
- **`src/data/`**: 静态 JSON 数据，充当模拟后端数据库
- **`src/components/`**: 通用布局组件（Header、Footer）
- **`src/router/`**: 路由定义，连接视图和 URL

## 开发指南

### 构建与编译
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览生产构建
npm run preview
```

### 路由结构
| 路径 | 名称 | 组件 | 说明 |
|------|------|------|------|
| `/` | Home | Home.vue | 首页 |
| `/consultation` | Consultation | Consultation.vue | 患者问诊 |
| `/consultation/:doctorUsername` | ConsultationRoom | Consultation.vue | 指定医生的问诊 |
| `/doctors` | Doctors | Doctors.vue | 医生目录 |
| `/about` | About | About.vue | 关于平台 |
| `/doctor/login` | DoctorLogin | DoctorLogin.vue | 医生登录 |
| `/doctor/room/:username` | DoctorRoom | DoctorRoom.vue | 医生诊室 |

### 数据模型概览
- **Doctor**: 医生信息（id, username, password, name, title, department, avatar, experience, specialties[], isActive）
- **Patient**: 患者信息（id, name, birthday, phone, gender）
- **Question**: 问诊问题（id, patientId, patientName, doctorId, doctorName, question, submitTime, status, answer, answerTime）

### 代码质量
- **类型检查**: `vue-tsc` 严格模式，启用 `strict`、`noUnusedLocals`、`noUnusedParameters`
- **Linting**: 未配置 ESLint/Prettier
- **测试**: 未配置测试框架

## 上下文文件参考

本工作区在 `.asdm/contexts/` 目录下提供以下上下文文件：

1. **[asdm.standard-project-structure.md](./asdm.standard-project-structure.md)** - 标准项目结构与组织
2. **[asdm.standard-coding-style.md](./asdm.standard-coding-style.md)** - 编码标准与风格指南
3. **[asdm.data-models.md](./asdm.data-models.md)** - 数据模型、关系与图表
4. **[asdm.deployment.md](./asdm.deployment.md)** - 部署配置与流程
5. **[asdm.api.md](./asdm.api.md)** - API 定义、端点与文档
6. **[asdm.architecture.md](./asdm.architecture.md)** - 系统架构与设计决策

## AI 模型指南

### 如何使用此上下文
1. **从本索引开始**，了解工作区整体结构
2. **根据任务查阅具体上下文文件**，获取详细信息
3. **遵循开发指南**，进行构建、测试和部署
4. **保持与现有模式和约定的一致性**

### 常见任务
- **添加新功能**: 先查阅架构和数据模型上下文
- **修改页面/视图**: 参考路由结构和对应的视图组件
- **修改业务逻辑**: 重点参考 `src/store/index.ts` 中的数据模型和方法
- **添加新数据**: 修改 `src/data/` 目录下的 JSON 文件

### 注意事项
- ⚠️ `HelloWorld.vue` 是脚手架残留组件，未在任何路由或父组件中使用
- 所有数据为内存存储，刷新页面后状态会重置为 JSON 初始数据
- 医生密码均为硬编码的 `123456`（仅用于演示）
- UI 文本以中文为主

## 版本历史
| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0.0 | 2026-05-08 | 初始上下文创建 | Context Builder |

---

*此上下文文件由 Context Builder 工具集维护。当工作区发生变更时，使用 `/asdm-context-update` 更新上下文。*
