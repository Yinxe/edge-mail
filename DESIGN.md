# 🎨 Edge Mail 设计规范

> **⚠️ 重要：开始任何前端/UI 工作前，必须先激活前端设计技能（如 `frontend-design`、`ui-ux-pro-max`），再参考本规范。**
>
> 本文件定义的是**设计方向与主题变量**，具体组件实现、交互细节、响应式断点等应依赖专业 UI 技能生成。

---

## 设计语言：轻松 · 休闲 · 生机 · 五彩

一个邮箱可以不只是黑白蓝的商务工具——它也可以让人 feel good。

| 关键词 | 含义 | 设计体现 |
|--------|------|----------|
| **轻松** | 无压、透气 | 大间距、柔和的阴影、舒缓的圆角 |
| **休闲** | 亲切、不正式 | 圆润的按钮、友好的文案语气、非衬线字体 |
| **生机** | 有活力、不沉闷 | 鲜明的品牌色 + 动态微交互（hover、过渡） |
| **五彩** | 丰富、不单调 | 多色点缀系统（标签、图标、状态色），每页有惊喜色 |

---

## 色彩体系

### 设计思路

Naive UI 默认绿色商务感较强。以下调色板改为**暖粉 + 活力橙 + 草木绿 + 晴空蓝**四色系统，保留绿色但让它更清新，同时引入粉/橙增加生机感。

### 品牌色（映射 Naive UI `themeOverrides.common`）

Naive UI 通过 `NConfigProvider` + `themeOverrides` 自定义。以下每个色值均可直接填入 `common` 对象。

| Token | 色值 | Naive UI `common` 键 | 用途 |
|-------|------|----------------------|------|
| **Primary** | `#E85D75` → 暖粉红 | `primaryColor` | 主按钮、链接、品牌元素 |
| Primary Hover | `#D94D65` | `primaryColorHover` | 按钮 hover |
| Primary Pressed | `#C43D55` | `primaryColorPressed` | 按钮按下 |
| Primary Suppl | `#F0788A` | `primaryColorSuppl` | 补充（信息条） |
| **Info** | `#4A9FE5` → 晴空蓝 | `infoColor` | 未读标记、信息提示 |
| **Success** | `#5BB98A` → 草木绿 | `successColor` | 成功状态、已读标记 |
| **Warning** | `#F5A623` → 暖橙 | `warningColor` | 警告 |
| **Error** | `#E55959` | `errorColor` | 错误、删除 |

### 中性色

| Token | 色值 | Naive UI `common` 键 | 用途 |
|-------|------|----------------------|------|
| 背景 | `#F8F6F7` | `bodyColor` | 页面底色（微暖灰） |
| 卡片 | `#FFFFFF` | `cardColor` | 卡片、侧栏、头部 |
| 边框 | `#EAE5E8` | `borderColor` | 分割线、边框 |
| 模态 | `#FFFFFF` | `modalColor` | 弹窗背景 |
| 文字主 | `#2D2327` | `textColor1` | 标题、正文 |
| 文字次 | `#6B5E63` | `textColor2` | 辅助信息 |
| 文字弱 | `#9E9196` | `textColor3` | 时间戳、占位符 |

### 语义色（五彩点缀系统）

| 色值 | 用途 | 出现场景 |
|------|------|----------|
| `#E85D75` 粉 | 品牌主色 | 按钮、头部、选中态 |
| `#4A9FE5` 蓝 | 未读/信息 | 未读小蓝点、"新"标签 |
| `#5BB98A` 绿 | 已读/成功 | 已读标记、成功 toast |
| `#F5A623` 橙 | 关注/星标 | 星标邮件、置顶标识 |
| `#A77DD9` 紫 | 特殊分类 | 附件标记、自定义标签 |

> **原则：** 每屏 1 个主色 + 1~2 个点缀色，不堆砌。五彩 ≠ 彩虹，而是有节制的多色调味。

---

## 排版

### 字体

```css
font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Noto Sans SC',
             'PingFang SC', 'Microsoft YaHei', sans-serif;
```

- **Nunito**（Google Fonts）— 圆润、亲切，适合"休闲"调性，中文字体回退到系统最佳
- 行高：`1.6`（比常规 1.5 略松，更"轻松"）

### 字号层级

| 层级 | 大小 | 字重 | 使用场景 |
|------|------|------|----------|
| 页面标题 | `text-xl` (20px) | `font-bold` (700) | 收件箱标题 |
| 邮件主题 | `text-base` (16px) | `font-semibold` (600) | 邮件列表主题行 |
| 邮件正文 | `text-sm` (14px) | `normal` (400) | 内文 |
| 元信息 | `text-xs` (12px) | `normal` (400) | 时间戳、发件人 |

---

## 间距与圆角

| 维度 | 值 | 说明 |
|------|-----|------|
| 卡片圆角 | `12px` | 比 Naive UI 默认 (3px) 更圆润 |
| 按钮圆角 | `10px` | 亲切、不锋利 |
| 输入框圆角 | `10px` | 同上 |
| 标签圆角 | `6px` | 小元素适度圆角 |
| 列表项内边距 | `px-4 py-3` | 透气 |
| 页面间隙 | `gap-4` / `space-y-4` | 统一呼吸感 |
| 头部高度 | `56px` (h-14) | 舒适不压迫 |

---

## Naive UI 主题配置（代码示例）

强调"使用设计技能"的具体体现——以下代码展示了如何将本规范落地到 Naive UI：

```ts
// src/main.ts 或 App.vue
import { NConfigProvider, zhCN, dateZhCN } from 'naive-ui'
import { defineComponent } from 'vue'

const themeOverrides = {
  common: {
    primaryColor: '#E85D75',
    primaryColorHover: '#D94D65',
    primaryColorPressed: '#C43D55',
    primaryColorSuppl: '#F0788A',
    infoColor: '#4A9FE5',
    successColor: '#5BB98A',
    warningColor: '#F5A623',
    errorColor: '#E55959',
    bodyColor: '#F8F6F7',
    cardColor: '#FFFFFF',
    modalColor: '#FFFFFF',
    borderColor: '#EAE5E8',
    textColor1: '#2D2327',
    textColor2: '#6B5E63',
    textColor3: '#9E9196',
    borderRadius: '12px',
    fontSize: '14px',
    fontSizeSmall: '12px',
    fontSizeLarge: '16px',
  },
  // 组件级覆盖
  Button: {
    borderRadius: '10px',
    fontWeight: '600',
  },
  Input: {
    borderRadius: '10px',
  },
  Card: {
    borderRadius: '12px',
    paddingMedium: '20px 24px',
  },
  Tag: {
    borderRadius: '6px',
  },
  Pagination: {
    borderRadius: '8px',
  },
}

export default defineComponent({
  render() {
    return (
      <NConfigProvider themeOverrides={themeOverrides} locale={zhCN} dateLocale={dateZhCN}>
        <router-view />
      </NConfigProvider>
    )
  },
})
```

> **提醒：** 以上代码仅为示例。实际实现时请使用专业 UI 技能生成完整代码，并确保与 `packages/web/src/` 现有结构兼容。

---

## 组件风格速查

### 按钮 (NButton)

| 类型 | 样式规则 |
|------|----------|
| Primary | 暖粉色填充，圆角 10px，字重 600 |
| Text | 无边框，hover 变品牌色 |
| Small | 缩小版用于侧栏操作 |

### 邮件列表项 (NListItem)

| 状态 | 样式 |
|------|------|
| 默认 | 白色背景，hover 淡粉 `#FFF5F6` |
| 选中 | 粉色底 `#FDE8EB` |
| 未读 | 左侧 3px 蓝色小竖条 (`#4A9FE5`) + `font-semibold` |
| 已读 | 常规字重，文字色降为 `textColor2` |

### 标签 (NTag)

| 用途 | type | color |
|------|------|-------|
| 新邮件 | `info` | `#4A9FE5` |
| 已读 | `success` | `#5BB98A` |
| 附件 | 自定义 | `#A77DD9` |
| 星标 | 自定义 | `#F5A623` |

### 空状态 (NEmpty)

- 描述文案用亲切语气："还没有邮件呢 ✨"，而非冷冰冰的"暂无数据"
- 图标用自定义 SVG（品牌色系）

---

## 动效指引

| 场景 | 属性 | 时长 | 缓动 |
|------|------|------|------|
| 按钮 hover | `background-color` + `box-shadow` | 200ms | `ease-out` |
| 列表行 hover | `background-color` | 150ms | `ease-out` |
| 页面切换 | `opacity` | 250ms | `ease-in-out` |
| 标签出现 | `scale(0.95 → 1)` | 200ms | `spring` |

> 所有动画必须尊重 `prefers-reduced-motion`，用户开启减少动效时降级为瞬时切换。

---

## 与其他设计资源的关系

| 资源 | 角色 |
|------|------|
| **本文件 DESIGN.md** | 定义**设计方向 + 主题变量**，是 source of truth |
| **Naive UI 官方文档** | Naive UI 组件 API 参考 |
| **UI 设计技能** | 生成具体组件代码、布局、交互、响应式实现 |
| **TailwindCSS v4** | 布局/间距工具类，与 Naive UI 互补 |

**工作流：**

```
设计方向 (DESIGN.md)
       ↓
激活 UI 技能 → 生成组件 / 页面代码
       ↓
用 Naive UI themeOverrides 注入配色
       ↓
TailwindCSS 处理布局 + 响应式
```

---

> 📐 本规范会随前端迭代更新。每次前端重构或引入新组件时，应先更新 DESIGN.md 再编码。
