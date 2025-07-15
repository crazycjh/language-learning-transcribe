# 聽打功能組件和功能關係圖

## 整體架構圖

```mermaid
graph TB
    subgraph "主容器 - VideoPlayerClient"
        VPC[VideoPlayerClient.tsx<br/>🎯 主要協調器]
        
        subgraph "左側區域 - 視頻播放"
            YTP[YouTubePlayer.tsx<br/>🎥 視頻播放器]
            MODE[模式切換按鈕<br/>👆 觀看 ↔ 練習]
            SD[SentenceDisplay.tsx<br/>📱 句子顯示(桌面版)]
        end
        
        subgraph "右側區域 - 練習功能"
            BFP[BlanksFillPractice.tsx<br/>📝 主要練習組件]
            STV[SrtTranscriptViewer.tsx<br/>📜 字幕查看器]
        end
    end
    
    subgraph "工具層 - srt-utils.ts"
        PARSE[parseSRT 📄<br/>解析字幕文件]
        CONVERT[convertToBlanksSegment 🔄<br/>轉換為填空練習]
        CALC1[calculateBlanksAccuracy 📊<br/>填空準確度計算]
        CALC2[calculateFreeTypingAccuracy 📈<br/>自由輸入準確度計算]
    end
    
    subgraph "API 層"
        API[/api/srt/[videoId] 🌐<br/>字幕API]
        OPENAI[/api/openai 🤖<br/>AI處理API]
    end
    
    VPC --> YTP
    VPC --> MODE
    VPC --> SD
    VPC --> BFP
    VPC --> STV
    
    BFP --> PARSE
    BFP --> CONVERT
    BFP --> CALC1
    BFP --> CALC2
    
    VPC --> API
    API --> OPENAI
    
    YTP -.->|時間回調| BFP
    MODE -.->|模式切換| BFP
    BFP -.->|播放控制| YTP
```

## BlanksFillPractice 詳細功能分解

```mermaid
mindmap
  root((BlanksFillPractice<br/>聽打練習核心))
    [狀態管理 🧠]
      [練習狀態]
        用戶輸入追蹤
        完成狀態標記
        準確度計算
        嘗試歷史記錄
      [播放狀態]
        播放/暫停控制
        循環模式開關
        時間追蹤
        自動暫停邏輯
      [記憶狀態]
        三難度記憶Map
        狀態快照保存
        跨難度恢復
        防競爭條件
    
    [三種難度模式 🎯]
      [初級模式]
        首字母提示
        hint生成邏輯
        簡單驗證
        建立信心
      [中級模式]
        長度提示
        _符號顯示
        中等挑戰
        技能進階
      [高級模式]
        完全自由輸入
        textarea界面
        整句聽寫
        高級挑戰
    
    [播放控制系統 🎵]
      [基本控制]
        播放/暫停
        重複播放
        上一句/下一句
        音量控制
      [高級功能]
        循環播放
        自動暫停
        跳過等待
        時間監控
      [狀態同步]
        與YouTube Player同步
        時間回調處理
        狀態一致性
        錯誤恢復
    
    [用戶界面 🎨]
      [練習區域]
        動態界面切換
        填空輸入框
        自由輸入框
        即時反饋
      [反饋系統]
        準確度顯示
        錯誤標示
        答案檢查
        進度追蹤
      [控制界面]
        難度選擇器
        播放控制按鈕
        操作按鈕組
        狀態指示器
    
    [準確度計算 📊]
      [填空模式算法]
        正確數/總數
        即時驗證
        重新驗證
        狀態保存
      [自由輸入算法]
        文本正規化
        逐詞比對
        位置匹配
        容錯處理
      [結果處理]
        分數計算
        歷史記錄
        視覺反饋
        改進建議
```

## 功能流程圖

```mermaid
sequenceDiagram
    participant U as 👤 用戶
    participant VPC as VideoPlayerClient
    participant BFP as BlanksFillPractice
    participant YTP as YouTubePlayer
    participant SU as srt-utils
    participant API as API服務
    
    Note over U,API: 🚀 系統初始化
    U->>VPC: 進入視頻頁面
    VPC->>API: 請求字幕數據
    API-->>VPC: 返回SRT內容
    VPC->>SU: 解析字幕
    SU-->>VPC: 返回Segments數組
    
    Note over U,API: 🎯 進入練習模式
    U->>VPC: 點擊練習模式
    VPC->>BFP: 激活練習組件
    BFP->>SU: 轉換為練習格式
    SU-->>BFP: 返回BlanksSegments
    
    Note over U,API: 📝 練習循環
    loop 練習每個句子
        U->>BFP: 選擇難度
        BFP->>BFP: 切換界面模式
        BFP->>BFP: 恢復記憶狀態
        
        U->>BFP: 控制播放
        BFP->>YTP: 發送播放指令
        YTP-->>BFP: 時間更新回調
        BFP->>BFP: 監控播放進度
        
        U->>BFP: 輸入答案
        BFP->>BFP: 即時驗證
        BFP->>BFP: 更新界面反饋
        
        U->>BFP: 提交答案
        BFP->>SU: 計算準確度
        SU-->>BFP: 返回分數
        BFP->>BFP: 保存記憶狀態
        BFP-->>U: 顯示結果反饋
        
        alt 重新嘗試
            U->>BFP: 點擊重試
            BFP->>BFP: 清空輸入
        else 下一句
            U->>BFP: 點擊下一句
            BFP->>BFP: 切換句子
        end
    end
```

## 狀態管理架構

```mermaid
stateDiagram-v2
    [*] --> 初始化: 組件載入
    
    state 初始化 {
        [*] --> 載入字幕
        載入字幕 --> 解析數據
        解析數據 --> 準備界面
        準備界面 --> [*]
    }
    
    初始化 --> 練習模式: 字幕載入完成
    
    state 練習模式 {
        [*] --> 難度選擇
        
        state 難度選擇 {
            [*] --> 初級
            [*] --> 中級
            [*] --> 高級
            初級 --> 中級: 切換難度
            中級 --> 高級: 切換難度
            高級 --> 初級: 切換難度
        }
        
        難度選擇 --> 播放控制
        
        state 播放控制 {
            [*] --> 暫停狀態
            暫停狀態 --> 播放中: 點擊播放
            播放中 --> 暫停狀態: 點擊暫停
            播放中 --> 循環等待: 循環模式結束
            循環等待 --> 播放中: 自動重播
            暫停狀態 --> 循環等待: 跳過等待
        }
        
        播放控制 --> 答案輸入
        
        state 答案輸入 {
            [*] --> 等待輸入
            等待輸入 --> 即時驗證: 用戶輸入
            即時驗證 --> 等待輸入: 繼續輸入
            等待輸入 --> 提交答案: 點擊提交
        }
        
        答案輸入 --> 結果反饋
        
        state 結果反饋 {
            [*] --> 計算準確度
            計算準確度 --> 顯示結果
            顯示結果 --> 保存狀態
            保存狀態 --> [*]
        }
        
        結果反饋 --> 難度選擇: 重新嘗試
        結果反饋 --> 句子切換: 下一句
        
        state 句子切換 {
            [*] --> 保存當前狀態
            保存當前狀態 --> 更新索引
            更新索引 --> 重置練習狀態
            重置練習狀態 --> [*]
        }
        
        句子切換 --> 難度選擇: 切換完成
    }
```

## 記憶系統工作原理

```mermaid
graph LR
    subgraph "用戶操作層"
        I1[初級輸入 📝]
        I2[中級輸入 ✏️]
        I3[高級輸入 📄]
    end
    
    subgraph "ID生成層"
        GEN[穩定ID生成器 🔑<br/>segmentId-wordIndex-cleanWord]
    end
    
    subgraph "數據收集層"
        COL[輸入收集器 📦<br/>收集所有用戶輸入]
        VAL[驗證器 ✅<br/>檢查輸入正確性]
    end
    
    subgraph "存儲層"
        M1[初級記憶 🗃️<br/>Map<string, string>]
        M2[中級記憶 🗂️<br/>Map<string, string>]
        M3[高級記憶 📁<br/>string]
        S1[初級狀態 💾<br/>PracticeState]
        S2[中級狀態 💿<br/>PracticeState]
        S3[高級狀態 💽<br/>PracticeState]
    end
    
    subgraph "恢復層"
        REST[狀態恢復器 🔄<br/>restoreDifficultyState]
        APPLY[界面應用器 🖥️<br/>更新UI狀態]
        SYNC[同步驗證器 🔗<br/>確保一致性]
    end
    
    I1 --> GEN
    I2 --> GEN
    I3 --> GEN
    
    GEN --> COL
    COL --> VAL
    
    VAL --> M1
    VAL --> M2
    VAL --> M3
    VAL --> S1
    VAL --> S2
    VAL --> S3
    
    M1 --> REST
    M2 --> REST
    M3 --> REST
    S1 --> REST
    S2 --> REST
    S3 --> REST
    
    REST --> APPLY
    APPLY --> SYNC
    
    SYNC -.->|恢復到| I1
    SYNC -.->|恢復到| I2
    SYNC -.->|恢復到| I3
```

## 準確度計算雙軌制

```mermaid
flowchart TD
    START([用戶提交答案 📤]) --> MODE{檢查練習模式 🎯}
    
    MODE -->|初級/中級| BLANK_PATH[填空模式路徑 📝]
    MODE -->|高級| FREE_PATH[自由輸入路徑 📄]
    
    subgraph "填空模式計算 📊"
        BLANK_PATH --> COLLECT[收集所有空格 📋]
        COLLECT --> VERIFY[逐個驗證空格 ✅]
        VERIFY --> COUNT_BLANK[統計正確數量 🔢]
        COUNT_BLANK --> CALC_BLANK[計算: 正確數/總數×100% 📈]
    end
    
    subgraph "自由輸入模式計算 📉"
        FREE_PATH --> NORMALIZE[文本正規化 🧹<br/>• 轉小寫<br/>• 去標點<br/>• 統一空格]
        NORMALIZE --> SPLIT[分割詞陣列 ✂️]
        SPLIT --> COMPARE[逐詞位置比對 🔍]
        COMPARE --> COUNT_FREE[統計匹配數量 📊]
        COUNT_FREE --> CALC_FREE[計算: 匹配數/最大長度×100% 📊]
    end
    
    CALC_BLANK --> RESULT[顯示結果 🎉]
    CALC_FREE --> RESULT
    
    RESULT --> HISTORY[保存到歷史 📚]
    RESULT --> FEEDBACK[生成反饋 💬]
    RESULT --> MEMORY[更新記憶 🧠]
    
    HISTORY --> END([完成 ✨])
    FEEDBACK --> END
    MEMORY --> END
    
    style BLANK_PATH fill:#e1f5fe
    style FREE_PATH fill:#fff3e0
    style RESULT fill:#e8f5e8
```

## 組件通信關係

```mermaid
graph TD
    subgraph "外部依賴 🔗"
        REACT[React Hooks 🪝]
        SHADCN[Shadcn/ui 🎨]
        LUCIDE[Lucide Icons 🎯]
    end
    
    subgraph "核心組件層 🏗️"
        VPC[VideoPlayerClient 🎬<br/>主協調器]
        BFP[BlanksFillPractice 📝<br/>練習核心]
        YTP[YouTubePlayer 🎥<br/>播放器]
        STV[SrtTranscriptViewer 📜<br/>字幕查看]
        SD[SentenceDisplay 📱<br/>句子顯示]
    end
    
    subgraph "工具函數層 🛠️"
        SU[srt-utils 📄<br/>字幕工具]
        CALC[計算函數 📊<br/>準確度算法]
        PARSE[解析函數 🔍<br/>SRT處理]
    end
    
    subgraph "數據層 💾"
        SEGMENTS[Segments[] 📋<br/>原始數據]
        BLANKS[BlanksSegments[] 📝<br/>練習數據]
        STATE[練習狀態 🧠<br/>用戶進度]
    end
    
    subgraph "API服務層 🌐"
        SRT_API[SRT API 📡<br/>字幕獲取]
        OPENAI_API[OpenAI API 🤖<br/>AI處理]
    end
    
    %% 依賴關係
    REACT --> BFP
    SHADCN --> BFP
    LUCIDE --> BFP
    
    %% 組件關係
    VPC --> BFP
    VPC --> YTP
    VPC --> STV
    VPC --> SD
    
    %% 雙向通信
    BFP <--> YTP
    BFP --> SU
    SU --> CALC
    SU --> PARSE
    
    %% 數據流
    SRT_API --> SEGMENTS
    SEGMENTS --> BLANKS
    BLANKS --> STATE
    
    %% API調用
    VPC --> SRT_API
    SU --> OPENAI_API
    
    %% 樣式定義
    classDef external fill:#f9f9f9,stroke:#999,stroke-width:2px
    classDef component fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef utility fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef data fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef api fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class REACT,SHADCN,LUCIDE external
    class VPC,BFP,YTP,STV,SD component
    class SU,CALC,PARSE utility
    class SEGMENTS,BLANKS,STATE data
    class SRT_API,OPENAI_API api
```

## 關鍵函數調用鏈

```mermaid
sequenceDiagram
    participant UI as 用戶界面 🖥️
    participant BFP as BlanksFillPractice 📝
    participant MEM as 記憶系統 🧠
    participant CALC as 計算引擎 📊
    participant YTP as YouTube播放器 🎥
    participant SU as srt-utils 🛠️
    
    Note over UI,SU: 🎬 難度切換流程
    UI->>BFP: handleDifficultyChange(newDifficulty)
    BFP->>MEM: saveCurrentDifficultyState(currentDifficulty)
    MEM-->>BFP: 狀態已保存 ✅
    BFP->>SU: convertToBlanksSegment(segments, newDifficulty)
    SU-->>BFP: 新難度的BlanksSegments
    BFP->>MEM: restoreDifficultyState(newDifficulty, newSegments)
    MEM-->>BFP: 恢復的狀態和輸入
    BFP-->>UI: 界面更新完成 🎯
    
    Note over UI,SU: 🎵 播放控制流程
    UI->>BFP: playCurrentSegment()
    BFP->>YTP: seekTo(startTime)
    BFP->>YTP: playVideo()
    YTP-->>BFP: onTimeUpdate(currentTime)
    BFP->>BFP: 監控時間 ⏰
    alt 到達結尾且循環模式
        BFP->>YTP: pauseVideo()
        BFP->>BFP: 等待1秒 ⏱️
        BFP->>BFP: playCurrentSegment() (遞歸)
    else 正常結束
        BFP->>YTP: pauseVideo()
        BFP-->>UI: 播放完成 🏁
    end
    
    Note over UI,SU: 📝 答案提交流程
    UI->>BFP: submitAnswer()
    alt 填空模式
        BFP->>BFP: 重新驗證所有空格
        BFP->>CALC: calculateBlanksAccuracy(blanks)
    else 自由輸入模式
        BFP->>CALC: calculateFreeTypingAccuracy(input, correct)
    end
    CALC-->>BFP: 準確度分數 📊
    BFP->>MEM: 立即保存狀態和分數
    MEM-->>BFP: 保存完成 💾
    BFP-->>UI: 顯示反饋結果 🎉
```

## 總結 📋

這個聽打練習系統展現了現代 React 應用的以下特色：

### 🏗️ **模組化架構**
- 清晰的組件職責分離
- 可重用的工具函數
- 良好的抽象層次

### 🧠 **智能狀態管理**
- 跨難度記憶保存
- 防競爭條件設計
- 狀態一致性保證

### 🎯 **用戶體驗優化**
- 漸進式難度設計
- 即時反饋機制
- 流暢的交互體驗

### ⚡ **性能優化**
- useCallback 優化
- 條件渲染策略
- 資源清理機制

這個架構圖展示了聽打功能的完整生態系統，幫助開發者理解各組件間的關係和數據流向，為後續維護和功能擴展提供清晰的指導。