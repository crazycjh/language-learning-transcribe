# 🎯 LingoBitz-Dictation-Pro

> **Stop passive watching, start active learning.**
> A comprehensive platform designed to transform video content into deep language acquisition.

<p align="center">
  <img src="./public/screenshots/intermediate-mode.png" alt="Intermediate mode" width="900" />
</p>

---

## 💡 Vision
LingoBitz addresses the common struggle where learners understand what they see but fail to recognize what they hear. By integrating contextual comprehension, progressive dictation, and social interaction, we turn passive viewing into an active cognitive process.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.7-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.2-61dafb)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8)](https://tailwindcss.com)

📖 **[中文文檔](./README-zh.md)**

---

## 🎯 Core Features at a Glance

| Category | Features | Description |
|----------|----------|-------------|
| **📝 Dictation Practice** | 3-Tier Difficulty | Beginner (first-letter) → Intermediate (length) → Advanced (free-form) |
| | Smart Memory System | Cross-difficulty state preservation and auto-migration of correct inputs |
| | Real-time Feedback | Instant accuracy calculation with attempt history tracking |
| **🎵 Playback Control** | Sentence-level Precision | Millisecond-accurate playback with auto-pause at sentence end |
| | Loop & Repeat | Automatically repeat challenging sentences for focused practice |
| **📖 Interactive Transcript** | Click to Jump | Navigate video instantly by clicking any subtitle line |
| | Auto-sync & Scroll | Subtitles automatically highlight and scroll to stay in sync with video |
| **🌍 Bilingual Learning** | Dual-language Support | View translations side-by-side (zh-TW, en) to bridge vocabulary gaps |
| **🤖 AI Intelligence** | Video & Chapter Summaries | AI-generated summaries to grasp context quickly before practicing |
| **🔗 Social Features** | Share & Challenge | One-click sentence sharing with instant link generation for friends |
| **📱 PWA Ready** | Mobile Optimized | Installable on home screen with a native app-like experience |

---

## ✨ The Learning Journey

### 1. 📖 Contextual Comprehension (Watch Mode)
Before practicing, use AI-generated summaries and interactive subtitles to build context and bridge vocabulary gaps. Click any subtitle to jump to that moment, view translations, and navigate through chapters seamlessly.

<p align="center">
  <img src="public/screenshots/subtitle-viewer.png" width="32%" />
  <img src="public/screenshots/video-summary.png" width="32%" />
  <img src="public/screenshots/segment&summary.png" width="32%" />
  <br/>
  <em>Interactive Transcript | AI Video Summary | Chapter-level Summaries</em>
</p>

> 🔗 [Design: System Architecture & R2 Storage Flow](./docs/DICTATION_SYSTEM_ARCHITECTURE.md)

---

### 2. 📝 Progressive Dictation (Practice Mode)
Internalize the language through "Active Recall". Choose from three difficulty tiers:
- **🟢 Beginner**: First-letter hints (e.g., `h____` for "hello")
- **🟡 Intermediate**: Length hints (e.g., `_____` for "hello")
- **🔴 Advanced**: Free-form typing (complete sentence dictation)

Our smart state preservation system automatically migrates correct inputs when switching between difficulty levels.

<p align="center">
  <img src="public/screenshots/easy-mode.png" width="32%" />
  <img src="public/screenshots/intermediate-mode.png" width="32%" />
  <img src="public/screenshots/advanced-mode.png" width="32%" />
  <br/>
  <em>🟢 Beginner Mode | 🟡 Intermediate Mode | 🔴 Advanced Mode</em>
</p>

> 🔗 [Implementation: Dictation Memory Mechanism & Algorithms](./docs/BLANKS_FILL_PRACTICE_TECHNICAL_GUIDE.md)

---

### 3. 🔗 Social Sharing & Challenges
Share specific sentences with friends from either Watch or Practice mode. Challenge them to match your accuracy on the same segment, making learning a collaborative and competitive experience.

<p align="center">
  <img src="public/screenshots/share-link.png" width="70%" />
  <br/>
  <em>One-click sharing with instant link generation.</em>
</p>

---

## 🎨 More Features

### Video Library & Organization
Browse and manage your learning materials in a centralized video list with thumbnails and metadata.

<p align="center">
  <img src="public/screenshots/video-list.png" width="70%" />
</p>

### Bilingual Support
View translations alongside original subtitles to accelerate vocabulary acquisition and comprehension.

<p align="center">
  <img src="public/screenshots/translation.png" width="70%" />
</p>

### Global Learning Environment
Full internationalization support (zh-TW, en) for diverse learning contexts.

<p align="center">
  <img src="public/screenshots/multi-language.png" width="70%" />
</p>

---

## 🛠️ Engineering Principles & Implementation

- **Component Architecture & Data Flow**: Modular design with coordinator pattern for cross-component state management. 📊 [View Complete Component Diagram](./docs/DICTATION_COMPONENTS_DIAGRAM_EN.md)
- **State Management with FSM**: Playback logic managed via a **Finite State Machine (FSM)**. 📖 [Deep Dive](./docs/STATE_MACHINE_DISCUSSION_EN.md)
- **Robustness & Testing**: Utilizing **Vitest + Property-based testing (fast-check)** for algorithm stability.
- **Modern Tech Stack**: Next.js 15.3.7 (App Router), React 19, Tailwind CSS v4, TanStack Query v5.

---

## 🚀 Quick Start

```bash
git clone <repository-url>
npm install
npm run dev
# Visit http://localhost:3500
```

---

## 📄 License
MIT License - Copyright (c) 2025 LingoBitz
 [組件設計：功能模塊化與通訊架構](./docs/DICTATION_COMPONENTS_DIAGRAM.md)