# LingoBitz

A tool for practicing listening with YouTube videos. You know that feeling when you watch something and think you understood it, but then you try to write it down and realize you didn't catch half of it? That's what this project is for.

<p align="center">
  <img src="./public/screenshots/intermediate-mode.png" alt="Intermediate mode" width="900" />
</p>

[![Next.js](https://img.shields.io/badge/Next.js-15.3.7-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.2-61dafb)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8)](https://tailwindcss.com)

📖 **[中文文檔](./README-zh.md)**

---

## Features

**Dictation Practice**
- Three difficulty levels: beginner shows first letter, intermediate shows length only, advanced is completely blank
- Switching difficulty preserves your input, no need to retype
- Instant accuracy calculation

**Playback Control**
- Sentence-by-sentence playback with auto-pause at the end
- Loop mode for repeating tricky sentences

**Subtitle Interaction**
- Click any subtitle to jump to that timestamp
- Subtitles auto-scroll to follow the video

**Other Stuff**
- Bilingual display (zh-TW, English)
- AI-generated video summaries and chapter highlights
- Share specific sentences with friends to challenge them
- PWA support, installable on mobile

---

## How to Use

### Watch Mode
Watch the video, read subtitles, check the summary to understand the content. Click subtitles to jump around, translations available for reference.

<p align="center">
  <img src="public/screenshots/subtitle-viewer.png" width="32%" />
  <img src="public/screenshots/video-summary.png" width="32%" />
  <img src="public/screenshots/segment&summary.png" width="32%" />
</p>

### Practice Mode
Switch to practice mode and start dictation. Pick your difficulty:

<p align="center">
  <img src="public/screenshots/easy-mode.png" width="32%" />
  <img src="public/screenshots/intermediate-mode.png" width="32%" />
  <img src="public/screenshots/advanced-mode.png" width="32%" />
</p>

- Beginner: `h____` (first letter shown)
- Intermediate: `_____` (length only)
- Advanced: type the whole sentence yourself

### Share & Challenge
Found a tough sentence? Share it with friends.

<p align="center">
  <img src="public/screenshots/share-link.png" width="70%" />
</p>

---

## More Screenshots

Video list:
<p align="center">
  <img src="public/screenshots/video-list.png" width="70%" />
</p>

Bilingual display:
<p align="center">
  <img src="public/screenshots/translation.png" width="70%" />
</p>

Multi-language UI:
<p align="center">
  <img src="public/screenshots/multi-language.png" width="70%" />
</p>

---

## Technical Details

For implementation details, check these docs:
- [Component Architecture](./docs/DICTATION_COMPONENTS_DIAGRAM_EN.md)
- [State Management Discussion](./docs/STATE_MACHINE_DISCUSSION_EN.md)
- [Dictation Practice Technical Guide](./docs/BLANKS_FILL_PRACTICE_TECHNICAL_GUIDE.md)

Tech stack: Next.js 15 (App Router), React 19, Tailwind CSS v4, TanStack Query v5

Testing with Vitest + fast-check for property-based testing.

---

## Quick Start

```bash
git clone <repository-url>
npm install
npm run dev
# http://localhost:3500
```

---

## License
MIT License - Copyright (c) 2025 LingoBitz
