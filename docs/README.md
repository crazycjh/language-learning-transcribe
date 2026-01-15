# 📚 LingoBitz-Dictation-Pro 技術文檔

> 深入了解系統架構、設計決策和實作細節

## 🎯 快速導航

### 給面試官 / 技術評審
**閱讀順序建議**：
1. 🏗️ [系統架構圖](./DICTATION_SYSTEM_ARCHITECTURE.md) - 5 分鐘了解整體架構
2. 📝 [聽打練習技術指南](./BLANKS_FILL_PRACTICE_TECHNICAL_GUIDE.md) - 核心功能實作細節
3. 🤖 [狀態機設計討論](./STATE_MACHINE_DISCUSSION.md) - 設計思考過程

### 給開發者
- 🎨 [設計文檔](./DICTATION_PRACTICE_DESIGN.md) - UI/UX 設計規範
- 📐 [組件關係圖](./DICTATION_COMPONENTS_DIAGRAM.md) - 組件架構視覺化
- 📊 [Google Analytics 設置](./google-analytics-setup.md) - GA4 配置指南

---

## 📂 文檔分類

### 🏗️ 系統架構
| 文檔 | 內容 | 閱讀時間 | 目標讀者 |
|------|------|----------|----------|
| [DICTATION_SYSTEM_ARCHITECTURE.md](./DICTATION_SYSTEM_ARCHITECTURE.md) | 整體系統架構、組件關係、數據流（Mermaid 圖表） | 5 分鐘 | 所有開發者 |
| [DICTATION_COMPONENTS_DIAGRAM.md](./DICTATION_COMPONENTS_DIAGRAM.md) | 組件詳細關係圖和功能分解 | 3 分鐘 | 前端開發者 |

### 💡 核心功能實作
| 文檔 | 內容 | 閱讀時間 | 目標讀者 |
|------|------|----------|----------|
| [BLANKS_FILL_PRACTICE_TECHNICAL_GUIDE.md](./BLANKS_FILL_PRACTICE_TECHNICAL_GUIDE.md) | 三層漸進式聽打練習完整實作指南 | 15 分鐘 | 前端開發者 |
| [DICTATION_PRACTICE_DESIGN.md](./DICTATION_PRACTICE_DESIGN.md) | 聽打系統設計規範和用戶流程 | 8 分鐘 | 產品經理/設計師 |

### 🤔 設計決策
| 文檔 | 內容 | 閱讀時間 | 目標讀者 |
|------|------|----------|----------|
| [STATE_MACHINE_DISCUSSION.md](./STATE_MACHINE_DISCUSSION.md) | 有限狀態機的應用討論和設計權衡 | 10 分鐘 | 架構師/資深開發者 |

### 🔧 配置指南
| 文檔 | 內容 | 閱讀時間 | 目標讀者 |
|------|------|----------|----------|
| [google-analytics-setup.md](./google-analytics-setup.md) | Google Analytics 4 完整設置流程 | 5 分鐘 | DevOps/開發者 |

---

## 🎓 學習路徑

### 路徑 1：快速了解系統（20 分鐘）
1. 閱讀根目錄 README.md (5 分鐘)
2. 查看 DICTATION_SYSTEM_ARCHITECTURE.md (5 分鐘)
3. 瀏覽 DICTATION_COMPONENTS_DIAGRAM.md (3 分鐘)
4. 選讀感興趣的技術文檔 (7 分鐘)

### 路徑 2：深入技術實作（1 小時）
1. 完整閱讀 BLANKS_FILL_PRACTICE_TECHNICAL_GUIDE.md
2. 研究 STATE_MACHINE_DISCUSSION.md 的設計思考
3. 對照代碼實作理解架構

### 路徑 3：準備面試/技術分享（30 分鐘）
1. README.md 核心亮點
2. DICTATION_SYSTEM_ARCHITECTURE.md 架構圖
3. STATE_MACHINE_DISCUSSION.md 設計權衡
4. 準備 Demo 展示

---

## 📊 技術棧速查

### 前端
- **框架**: Next.js 15 (App Router)
- **UI**: React 19 + TypeScript 5
- **樣式**: Tailwind CSS v4 + Shadcn/ui
- **狀態**: TanStack Query v5 + React Hooks
- **測試**: Vitest + fast-check

### 後端 & 服務
- **存儲**: Cloudflare R2 / AWS S3
- **國際化**: next-intl (zh-TW, en)
- **分析**: Google Analytics 4
- **PWA**: next-pwa

---

## 🔄 文檔更新記錄

### 2026-01-15
- ✅ 重構文檔結構，採用分層策略
- ✅ 移除過時的 01-06 系列文檔
- ✅ 新增文檔導航和學習路徑
- ✅ 更新技術棧版本資訊

### 2025-07-14
- 新增聽打系統核心文檔
- 新增狀態機設計討論
