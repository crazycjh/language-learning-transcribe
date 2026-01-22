# 聽打功能組件架構

這份文檔說明聽打練習功能的組件結構和資料流。

## 整體架構

```mermaid
graph TB
    subgraph "VideoPlayerClient 主容器"
        VPC[VideoPlayerClient.tsx]
        
        subgraph "左側 - 影片"
            YTP[YouTubePlayer]
            MODE[模式切換按鈕]
            SD[SentenceDisplay]
        end
        
        subgraph "右側 - 練習"
            BFP[BlanksFillPractice]
            STV[SrtTranscriptViewer]
        end
    end
    
    subgraph "工具函數 srt-utils.ts"
        PARSE[parseSRT]
        CONVERT[convertToBlanksSegment]
        CALC1[calculateBlanksAccuracy]
        CALC2[calculateFreeTypingAccuracy]
    end
    
    subgraph "API 層"
        API["api/srt/videoId"]
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
    
    YTP -.->|時間回調| BFP
    MODE -.->|模式切換| BFP
    BFP -.->|播放控制| YTP
```

## BlanksFillPractice 內部結構

這是聽打練習的核心組件，負責：

**狀態管理**
- 練習狀態：用戶輸入、完成狀態、準確度、嘗試歷史
- 播放狀態：播放/暫停、循環模式、時間追蹤
- 記憶狀態：三種難度各自的輸入記錄

**三種難度**
- 初級：首字母提示（`h____`）
- 中級：長度提示（`_____`）
- 高級：自由輸入整句

**播放控制**
- 播放/暫停/重複
- 循環播放
- 上一句/下一句
- 自動暫停（播到句尾停下來）

## 資料流

```mermaid
sequenceDiagram
    participant User as 用戶
    participant VPC as VideoPlayerClient
    participant BFP as BlanksFillPractice
    participant YTP as YouTubePlayer
    participant SU as srt-utils

    User->>VPC: 進入頁面
    VPC->>VPC: 載入字幕
    VPC->>SU: parseSRT
    SU-->>VPC: Segments[]
    
    User->>VPC: 切到練習模式
    VPC->>BFP: 傳入 segments
    BFP->>SU: convertToBlanksSegment
    SU-->>BFP: BlanksSegments[]
    
    loop 練習
        User->>BFP: 選難度
        BFP->>BFP: 恢復該難度的記憶
        
        User->>BFP: 播放
        BFP->>YTP: seekTo + playVideo
        YTP-->>BFP: onTimeUpdate
        
        User->>BFP: 填答案
        User->>BFP: 提交
        BFP->>SU: calculateAccuracy
        SU-->>BFP: 準確度
        BFP->>BFP: 保存到記憶
    end
```

## 記憶系統

切換難度時會保存當前輸入，切回來時恢復。

關鍵是 ID 的穩定性：用 `segmentId-wordIndex-cleanWord` 當 ID，這樣同一個單字在不同難度下 ID 一樣，才能正確恢復。

```mermaid
graph LR
    subgraph "輸入"
        I1[初級輸入]
        I2[中級輸入]
        I3[高級輸入]
    end
    
    subgraph "存儲"
        M1[初級記憶 Map]
        M2[中級記憶 Map]
        M3[高級記憶]
    end
    
    subgraph "恢復"
        REST[restoreDifficultyState]
    end
    
    I1 --> M1
    I2 --> M2
    I3 --> M3
    
    M1 --> REST
    M2 --> REST
    M3 --> REST
    
    REST -.-> I1
    REST -.-> I2
    REST -.-> I3
```

## 準確度計算

兩種算法：

**填空模式（初級/中級）**
```
準確度 = 正確空格數 / 總空格數 × 100%
```

**自由輸入（高級）**
```
1. 文字正規化（小寫、去標點、統一空格）
2. 切成單字陣列
3. 逐位置比對
4. 準確度 = 匹配數 / max(用戶詞數, 正確詞數) × 100%
```

## 播放狀態

用多個 boolean 組合表示狀態：

| 狀態 | isPlaying | isStarting | isLoopWaiting |
|------|-----------|------------|---------------|
| 閒置 | false | false | false |
| 啟動中 | false | true | false |
| 播放中 | true | false | false |
| 循環等待 | false | false | true |

這其實是個隱式的狀態機，詳細討論見 [STATE_MACHINE_DISCUSSION.md](./STATE_MACHINE_DISCUSSION.md)。
