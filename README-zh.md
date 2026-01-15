# 🎯 LingoBitz-Dictation-Pro

> **不只是看影片，更是在「掌握」語言。**
> 一個專為語言學習者設計的「理解 → 練習 → 分享」全方位學習平台。

<p align="center">
  <img src="./public/screenshots/intermediate-mode.png" alt="中級模式" width="900" />
</p>

---

## 💡 專案願景
LingoBitz 旨在解決語言學習者在觀看影片時「以為看懂了，其實聽不出來」的痛點。透過將影片理解、漸進式聽寫練習與社交互動結合，我們將被動的收看行為轉化為主動的語言內化過程。

[![Next.js](https://img.shields.io/badge/Next.js-15.3.7-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.2-61dafb)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8)](https://tailwindcss.com)

📖 **[English Document](./README.md)**

---

## 🎯 核心功能一覽

| 分類 | 功能特性 | 說明 |
|------|----------|------|
| **📝 聽打練習** | 三層漸進式難度 | 初級 (首字母提示) → 中級 (長度提示) → 高級 (完全自由輸入) |
| | 智能記憶系統 | 跨難度狀態保存，切換難度時自動遷移正確輸入 |
| | 即時反饋機制 | 填寫時即時計算準確度，並記錄嘗試歷史 |
| **🎵 播放控制** | 句子級精確播放 | 毫秒級精確定位，句子結束自動暫停以利練習 |
| | 循環播放模式 | 針對難句設定自動重複播放，強化聽力印象 |
| **📖 互動字幕** | 點擊跳轉 | 點擊任意字幕行即可讓影片精確跳轉至該時間點 |
| | 自動同步滾動 | 字幕隨影片進度自動高亮並滾動至最佳視角 |
| **🌍 雙語學習** | 雙語對照顯示 | 同時顯示原文與翻譯 (繁中/英文)，快速攻克生詞 |
| **🤖 AI 智慧** | 影片與章節摘要 | AI 自動生成影片大意與章節總結，練習前快速掌握脈絡 |
| **🔗 社交互動** | 分享與挑戰 | 一鍵產生特定句子的分享連結，邀請朋友參與聽寫挑戰 |
| **📱 PWA 支援** | 行動裝置優化 | 支援安裝至桌面，提供類原生應用的流暢操作體驗 |

---

## ✨ 核心學習流程

### 1. 📖 深度理解模式 (Watch Mode)
在練習前，透過 AI 智慧摘要與互動字幕建立語境背景。點擊任意字幕即可跳轉播放、查看翻譯，並在章節間順暢導航。

<p align="center">
  <img src="public/screenshots/subtitle-viewer.png" width="32%" />
  <img src="public/screenshots/video-summary.png" width="32%" />
  <img src="public/screenshots/segment&summary.png" width="32%" />
  <br/>
  <em>互動式字幕查看器 | AI 影片摘要 | 章節級摘要</em>
</p>

> 🔗 [技術設計：系統架構與 R2 存取流程](./docs/DICTATION_SYSTEM_ARCHITECTURE.md)

---

### 2. 📝 三層漸進式聽寫 (Practice Mode)
透過「主動回憶」將理解轉化為長期記憶。系統提供三種難度模式：
- **🟢 初級**: 首字母提示（例如：`h____` 代表 "hello"）
- **🟡 中級**: 長度提示（例如：`_____` 代表 "hello"）
- **🔴 高級**: 完全自由輸入（整句聽寫）

智能狀態記憶系統會在切換難度時，自動遷移正確的輸入內容。

<p align="center">
  <img src="public/screenshots/easy-mode.png" width="32%" />
  <img src="public/screenshots/intermediate-mode.png" width="32%" />
  <img src="public/screenshots/advanced-mode.png" width="32%" />
  <br/>
  <em>🟢 初級模式 | 🟡 中級模式 | 🔴 高級模式</em>
</p>

> 🔗 [技術實踐：聽寫記憶機制與演算法設計](./docs/BLANKS_FILL_PRACTICE_TECHNICAL_GUIDE.md)

---

### 3. 🔗 社交挑戰與分享 (Share & Challenge)
無論在觀看或練習模式，皆可一鍵分享特定句子給朋友。發起挑戰，讓朋友嘗試同一句子的聽寫準確度，將學習變成協作與競爭並存的體驗。

<p align="center">
  <img src="public/screenshots/share-link.png" width="70%" />
  <br/>
  <em>一鍵分享，即時產生連結。</em>
</p>

---

## 🎨 更多功能

### 影片庫與管理
集中管理所有學習素材，透過縮圖與元數據輕鬆瀏覽。

<p align="center">
  <img src="public/screenshots/video-list.png" width="70%" />
</p>

### 雙語對照支援
在原文字幕旁同步顯示翻譯，加速詞彙學習與理解。

<p align="center">
  <img src="public/screenshots/translation.png" width="70%" />
</p>

### 全球化學習環境
完整的國際化支援（zh-TW, en），適應多元學習情境。

<p align="center">
  <img src="public/screenshots/multi-language.png" width="70%" />
</p>

---

## 🛠️ 工程設計與技術實踐

- **組件架構與資料流**: 採用模組化設計與協調器模式管理跨組件狀態。 📊 [完整組件架構圖](./docs/DICTATION_COMPONENTS_DIAGRAM.md)
- **複雜狀態機管理**: 採用**有限狀態機 (FSM)** 設計播放器控制邏輯。 📖 [深入探討](./docs/STATE_MACHINE_DISCUSSION.md)
- **強健性驗證**: 引入 **Vitest + Property-based testing** 確保核心演算法在極端情況下的穩定性。
- **現代技術棧**: Next.js 15.3.7 (App Router), React 19, Tailwind CSS v4, TanStack Query v5。

---

## 🚀 快速開始

```bash
git clone <repository-url>
npm install
npm run dev
# 訪問 http://localhost:3500
```

---

## 📄 授權協議
MIT License - Copyright (c) 2025 LingoBitz
