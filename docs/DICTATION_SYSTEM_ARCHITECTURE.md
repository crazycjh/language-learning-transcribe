# 聽打練習系統架構圖

## 整體系統架構

```mermaid
graph TB
    subgraph "VideoPlayerClient (主容器)"
        VPC[VideoPlayerClient.tsx]
        VPC --> YTP[YouTubePlayer]
        VPC --> BFP[BlanksFillPractice]
        VPC --> STV[SrtTranscriptViewer]
        VPC --> SD[SentenceDisplay]
    end

    subgraph "核心組件層"
        YTP --> YPI[YouTubePlayerInterface]
        BFP --> SU[srt-utils]
        BFP --> UI[ui/components]
    end

    subgraph "數據處理層"
        SU --> |解析| SRT[SRT 字幕文件]
        SU --> |轉換| BS[BlanksSegment]
        SU --> |計算| ACC[準確度算法]
    end

    subgraph "API 層"
        API["/api/srt/[videoId]"] --> SRT
        OPENAI["/api/openai"] --> |AI處理| SRT
    end

    subgraph "存儲層"
        R2[Cloudflare R2] --> |文件存儲| SRT
        LOCAL[uploads/] --> |本地存儲| SRT
    end
```

## 聽打練習核心組件架構

```mermaid
graph TD
    subgraph "BlanksFillPractice 主組件"
        BFP[BlanksFillPractice.tsx]
        
        subgraph "狀態管理"
            PS[PracticeState]
            DM[DifficultyMemory]
            BS[BlanksSegments]
            PC[PlaybackControl]
        end

        subgraph "難度模式"
            BEG[初級模式<br/>首字母提示]
            INT[中級模式<br/>長度提示]
            ADV[高級模式<br/>自由輸入]
        end

        subgraph "播放控制"
            PLAY[播放/暫停]
            LOOP[循環播放]
            NAV[導航控制]
            AUTO[自動暫停]
        end

        subgraph "記憶系統"
            SAVE[saveCurrentDifficultyState]
            RESTORE[restoreDifficultyState]
            MEMORY[AllDifficultyMemory]
        end

        subgraph "準確度計算"
            BLANK_ACC[calculateBlanksAccuracy]
            FREE_ACC[calculateFreeTypingAccuracy]
        end
    end

    BFP --> PS
    BFP --> DM
    BFP --> BS
    BFP --> PC
    
    PS --> BEG
    PS --> INT
    PS --> ADV
    
    PC --> PLAY
    PC --> LOOP
    PC --> NAV
    PC --> AUTO
    
    DM --> SAVE
    DM --> RESTORE
    DM --> MEMORY
    
    BS --> BLANK_ACC
    ADV --> FREE_ACC
```

## 數據流向圖

```mermaid
sequenceDiagram
    participant User as 用戶
    participant VPC as VideoPlayerClient
    participant BFP as BlanksFillPractice
    participant YTP as YouTubePlayer
    participant SU as srt-utils
    participant API as API

    User->>VPC: 選擇練習模式
    VPC->>API: 載入 SRT 字幕
    API-->>VPC: 返回字幕內容
    VPC->>SU: 解析 SRT
    SU-->>VPC: 返回 Segments
    VPC->>BFP: 傳入 segments
    
    loop 練習循環
        User->>BFP: 選擇難度
        BFP->>SU: convertToBlanksSegment
        SU-->>BFP: 返回 BlanksSegment
        BFP->>BFP: restoreDifficultyState
        
        User->>BFP: 控制播放
        BFP->>YTP: 播放控制指令
        YTP-->>BFP: 時間更新回調
        
        User->>BFP: 輸入答案
        BFP->>BFP: updateBlankInput / 即時驗證
        
        User->>BFP: 提交答案
        BFP->>SU: calculateAccuracy
        SU-->>BFP: 返回準確度
        BFP->>BFP: saveCurrentDifficultyState
        BFP-->>User: 顯示反饋
    end
```

## 組件功能分解圖

```mermaid
mindmap
  root((聽打練習系統))
    [用戶介面層]
      [難度選擇器]
        初級按鈕
        中級按鈕
        高級按鈕
      [播放控制區]
        播放/暫停按鈕
        重複播放按鈕
        循環播放開關
        上一句/下一句
      [練習區域]
        填空輸入框(初中級)
        自由輸入框(高級)
        提交按鈕
      [反饋區域]
        準確度顯示
        答案檢查
        操作按鈕
    
    [狀態管理層]
      [練習狀態]
        用戶輸入
        完成狀態
        準確度
        嘗試歷史
      [播放狀態]
        播放中
        暫停時間
        循環模式
        等待狀態
      [記憶狀態]
        各難度輸入
        狀態快照
        恢復機制
    
    [業務邏輯層]
      [難度處理]
        空格生成
        提示邏輯
        驗證規則
      [播放控制]
        時間追蹤
        自動暫停
        循環機制
      [準確度計算]
        填空算法
        自由輸入算法
        文本正規化
    
    [數據處理層]
      [SRT解析]
        時間軸解析
        文本分割
        段落組織
      [空格轉換]
        單詞篩選
        ID生成
        顯示格式
      [狀態持久化]
        記憶保存
        狀態恢復
        數據同步
```

## 狀態管理架構圖

```mermaid
stateDiagram-v2
    [*] --> 載入中
    載入中 --> 練習模式 : 字幕載入完成
    
    state 練習模式 {
        [*] --> 選擇難度
        選擇難度 --> 初級模式
        選擇難度 --> 中級模式
        選擇難度 --> 高級模式
        
        state 初級模式 {
            [*] --> 顯示提示
            顯示提示 --> 等待輸入
            等待輸入 --> 即時驗證
            即時驗證 --> 等待輸入
            等待輸入 --> 提交答案
        }
        
        state 中級模式 {
            [*] --> 顯示長度
            顯示長度 --> 等待輸入
            等待輸入 --> 即時驗證
            即時驗證 --> 等待輸入
            等待輸入 --> 提交答案
        }
        
        state 高級模式 {
            [*] --> 自由輸入
            自由輸入 --> 提交答案
        }
        
        提交答案 --> 計算準確度
        計算準確度 --> 顯示反饋
        顯示反饋 --> 重新嘗試
        顯示反饋 --> 下一句
        重新嘗試 --> 等待輸入
        下一句 --> 選擇難度
        
        初級模式 --> 中級模式 : 切換難度
        中級模式 --> 高級模式 : 切換難度
        高級模式 --> 初級模式 : 切換難度
    }
```

## 播放控制流程圖

```mermaid
flowchart TD
    START([用戶點擊播放]) --> CHECK{檢查狀態}
    CHECK -->|正在播放| PAUSE[暫停播放]
    CHECK -->|未播放| PLAY[開始播放]
    CHECK -->|循環等待中| SKIP[跳過等待]
    
    PLAY --> SEEK[跳轉到片段開始]
    SEEK --> DELAY[延遲100ms]
    DELAY --> START_PLAY[開始播放]
    START_PLAY --> MONITOR[監控播放時間]
    
    MONITOR --> TIME_CHECK{時間檢查}
    TIME_CHECK -->|未到結尾| CONTINUE[繼續監控]
    TIME_CHECK -->|到達結尾| LOOP_CHECK{循環模式?}
    
    LOOP_CHECK -->|是| LOOP_WAIT[循環等待1秒]
    LOOP_CHECK -->|否| AUTO_PAUSE[自動暫停]
    
    LOOP_WAIT --> COUNTDOWN[顯示倒數]
    COUNTDOWN --> REPLAY[重新播放]
    REPLAY --> MONITOR
    
    PAUSE --> SAVE_TIME[保存暫停時間]
    SKIP --> START_PLAY
    AUTO_PAUSE --> END([結束])
    CONTINUE --> MONITOR
```

## 記憶系統架構圖

```mermaid
graph LR
    subgraph "記憶系統架構"
        subgraph "輸入層"
            UI1[初級輸入]
            UI2[中級輸入] 
            UI3[高級輸入]
        end
        
        subgraph "轉換層"
            EXTRACT[提取用戶輸入]
            VALIDATE[驗證輸入]
            GENERATE_ID[生成穩定ID]
        end
        
        subgraph "存儲層"
            MAP1[初級記憶Map]
            MAP2[中級記憶Map]
            MAP3[高級記憶Map]
            STATE1[初級狀態快照]
            STATE2[中級狀態快照]
            STATE3[高級狀態快照]
        end
        
        subgraph "恢復層"
            RESTORE[狀態恢復]
            APPLY[應用到界面]
            VERIFY[驗證一致性]
        end
    end
    
    UI1 --> EXTRACT
    UI2 --> EXTRACT
    UI3 --> EXTRACT
    
    EXTRACT --> VALIDATE
    VALIDATE --> GENERATE_ID
    GENERATE_ID --> MAP1
    GENERATE_ID --> MAP2
    GENERATE_ID --> MAP3
    
    MAP1 --> STATE1
    MAP2 --> STATE2
    MAP3 --> STATE3
    
    STATE1 --> RESTORE
    STATE2 --> RESTORE
    STATE3 --> RESTORE
    
    RESTORE --> APPLY
    APPLY --> VERIFY
    VERIFY --> UI1
    VERIFY --> UI2
    VERIFY --> UI3
```

## 準確度計算流程圖

```mermaid
flowchart TD
    INPUT([用戶提交答案]) --> MODE_CHECK{練習模式}
    
    MODE_CHECK -->|初級/中級| BLANK_MODE[填空模式]
    MODE_CHECK -->|高級| FREE_MODE[自由輸入模式]
    
    subgraph "填空模式計算"
        BLANK_MODE --> COLLECT[收集所有空格]
        COLLECT --> VALIDATE_BLANK[驗證每個空格]
        VALIDATE_BLANK --> COUNT_CORRECT[統計正確數量]
        COUNT_CORRECT --> CALC_BLANK[計算: 正確數/總數×100%]
    end
    
    subgraph "自由輸入模式計算"
        FREE_MODE --> NORMALIZE[文本正規化]
        NORMALIZE --> SPLIT_WORDS[分割為詞陣列]
        SPLIT_WORDS --> COMPARE[逐詞位置比對]
        COMPARE --> COUNT_MATCH[統計匹配數量]
        COUNT_MATCH --> CALC_FREE[計算: 匹配數/最大長度×100%]
    end
    
    CALC_BLANK --> DISPLAY[顯示準確度]
    CALC_FREE --> DISPLAY
    DISPLAY --> SAVE_HISTORY[保存到歷史記錄]
    SAVE_HISTORY --> END([完成])
```

## 組件依賴關係圖

```mermaid
graph TD
    subgraph "外部依賴"
        REACT[React Hooks]
        LUCIDE[Lucide Icons]
        SHADCN[Shadcn/ui]
    end
    
    subgraph "內部工具"
        SRT_UTILS[srt-utils.ts]
        YOUTUBE_PLAYER[YouTubePlayer.tsx]
        UI_COMPONENTS[ui/components]
    end
    
    subgraph "主要組件"
        VIDEO_CLIENT[VideoPlayerClient.tsx]
        BLANKS_PRACTICE[BlanksFillPractice.tsx]
        TRANSCRIPT_VIEWER[SrtTranscriptViewer.tsx]
        SENTENCE_DISPLAY[SentenceDisplay.tsx]
    end
    
    subgraph "API 服務"
        SRT_API[/api/srt/[videoId]]
        OPENAI_API[/api/openai]
    end
    
    REACT --> BLANKS_PRACTICE
    LUCIDE --> BLANKS_PRACTICE
    SHADCN --> BLANKS_PRACTICE
    
    SRT_UTILS --> BLANKS_PRACTICE
    YOUTUBE_PLAYER --> VIDEO_CLIENT
    UI_COMPONENTS --> BLANKS_PRACTICE
    
    VIDEO_CLIENT --> BLANKS_PRACTICE
    VIDEO_CLIENT --> TRANSCRIPT_VIEWER
    VIDEO_CLIENT --> SENTENCE_DISPLAY
    VIDEO_CLIENT --> YOUTUBE_PLAYER
    
    SRT_API --> VIDEO_CLIENT
    OPENAI_API --> SRT_UTILS
```

## 總結

這個聽打練習系統展現了以下關鍵特性：

### 🏗️ **模組化設計**
- 清晰的組件分離和職責劃分
- 可重用的工具函數和UI組件
- 良好的依賴注入模式

### 🧠 **智能狀態管理**
- 跨難度的記憶保存機制
- 防競爭條件的狀態同步
- 完整的狀態生命週期管理

### 🎯 **用戶體驗優化**
- 三種漸進式難度設計
- 即時反饋和視覺提示
- 流暢的播放控制體驗

### ⚡ **性能考量**
- 優化的重新渲染策略
- 智能的狀態更新批處理
- 有效的資源清理機制

這個架構圖幫助開發者快速理解整個系統的結構和數據流向，便於維護和擴展功能。