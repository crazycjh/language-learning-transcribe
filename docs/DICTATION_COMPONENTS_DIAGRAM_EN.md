# Dictation Feature Component Architecture

This doc explains the component structure and data flow of the dictation practice feature.

## Overall Architecture

```mermaid
graph TB
    subgraph "VideoPlayerClient Container"
        VPC[VideoPlayerClient.tsx]
        
        subgraph "Left - Video"
            YTP[YouTubePlayer]
            MODE[Mode Switch Button]
            SD[SentenceDisplay]
        end
        
        subgraph "Right - Practice"
            BFP[BlanksFillPractice]
            STV[SrtTranscriptViewer]
        end
    end
    
    subgraph "Utils srt-utils.ts"
        PARSE[parseSRT]
        CONVERT[convertToBlanksSegment]
        CALC1[calculateBlanksAccuracy]
        CALC2[calculateFreeTypingAccuracy]
    end
    
    subgraph "API Layer"
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
    
    YTP -.->|time callback| BFP
    MODE -.->|mode switch| BFP
    BFP -.->|playback control| YTP
```

## BlanksFillPractice Internals

This is the core component for dictation practice. It handles:

**State Management**
- Practice state: user input, completion status, accuracy, attempt history
- Playback state: play/pause, loop mode, time tracking
- Memory state: input records for each difficulty level

**Three Difficulty Levels**
- Beginner: first letter hint (`h____`)
- Intermediate: length hint (`_____`)
- Advanced: free-form full sentence input

**Playback Control**
- Play/pause/repeat
- Loop playback
- Previous/next sentence
- Auto-pause at sentence end

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant VPC as VideoPlayerClient
    participant BFP as BlanksFillPractice
    participant YTP as YouTubePlayer
    participant SU as srt-utils

    User->>VPC: Enter page
    VPC->>VPC: Load subtitles
    VPC->>SU: parseSRT
    SU-->>VPC: Segments[]
    
    User->>VPC: Switch to practice mode
    VPC->>BFP: Pass segments
    BFP->>SU: convertToBlanksSegment
    SU-->>BFP: BlanksSegments[]
    
    loop Practice
        User->>BFP: Select difficulty
        BFP->>BFP: Restore memory for that difficulty
        
        User->>BFP: Play
        BFP->>YTP: seekTo + playVideo
        YTP-->>BFP: onTimeUpdate
        
        User->>BFP: Fill answers
        User->>BFP: Submit
        BFP->>SU: calculateAccuracy
        SU-->>BFP: Accuracy
        BFP->>BFP: Save to memory
    end
```

## Memory System

When switching difficulty, current input is saved and restored when switching back.

The key is stable IDs: we use `segmentId-wordIndex-cleanWord` as ID, so the same word has the same ID across difficulties, enabling correct restoration.

```mermaid
graph LR
    subgraph "Input"
        I1[Beginner Input]
        I2[Intermediate Input]
        I3[Advanced Input]
    end
    
    subgraph "Storage"
        M1[Beginner Memory Map]
        M2[Intermediate Memory Map]
        M3[Advanced Memory]
    end
    
    subgraph "Restore"
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

## Accuracy Calculation

Two algorithms:

**Blanks Mode (Beginner/Intermediate)**
```
Accuracy = correct blanks / total blanks * 100%
```

**Free Input (Advanced)**
```
1. Normalize text (lowercase, remove punctuation, normalize spaces)
2. Split into word arrays
3. Compare position by position
4. Accuracy = matches / max(user words, correct words) * 100%
```

## Playback State

Multiple booleans combined to represent state:

| State | isPlaying | isStarting | isLoopWaiting |
|-------|-----------|------------|---------------|
| Idle | false | false | false |
| Starting | false | true | false |
| Playing | true | false | false |
| Loop Waiting | false | false | true |

This is essentially an implicit state machine. See [STATE_MACHINE_DISCUSSION_EN.md](./STATE_MACHINE_DISCUSSION_EN.md) for details.
