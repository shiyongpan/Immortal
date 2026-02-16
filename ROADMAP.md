# UE5 WebSocket 實時多人開發指南

## 📋 目錄

1. [基礎概念](#基礎概念)
2. [環境準備](#環境準備)
3. [UE5 網路架構選擇](#ue5-網路架構選擇)
4. [WebSocket vs UE5 內建網路](#websocket-vs-ue5-內建網路)
5. [實作步驟](#實作步驟)
6. [最佳實踐](#最佳實踐)
7. [常見問題](#常見問題)

---

## 基礎概念

### 什麼是 WebSocket？

WebSocket 是一種雙向通訊協議，允許客戶端和伺服器之間建立持久連接。

**特點：**

- ✅ 低延遲（相比 HTTP 輪詢）
- ✅ 雙向即時通訊
- ✅ 減少網路開銷
- ❌ 需要自己處理斷線重連
- ❌ 需要自己實作狀態同步邏輯

### UE5 多人遊戲的兩種方式

#### 1️⃣ 使用 UE5 內建 Replication（推薦新手）

- UE5 自動處理狀態同步
- 使用 `UFUNCTION(Server/Client/NetMulticast)` 標記
- 使用 `UPROPERTY(Replicated)` 自動同步變數
- **優點：** 簡單、穩定、官方支援
- **缺點：** 較難整合外部後端（如 PostgreSQL）

#### 2️⃣ 使用 WebSocket + 自訂同步（進階）

- 完全自訂通訊協議
- 容易整合 Node.js 後端和資料庫
- **優點：** 靈活、可整合複雜後端邏輯
- **缺點：** 需要自己寫同步邏輯

---

## 環境準備

### 所需工具

```
✅ Unreal Engine 5.3+
✅ Node.js 18+ (後端 WebSocket 伺服器)
✅ PostgreSQL 14+ (資料庫)
✅ Visual Studio Code (後端開發)
✅ Visual Studio 2022 (UE5 C++ 開發)
```

### UE5 插件需求

對於 WebSocket 連接，你需要：

**選項 A：使用第三方插件**

- **VaRest** (免費) - 支援 HTTP 和 WebSocket
- **SocketIO Client** (付費) - Socket.IO 專用

**選項 B：使用 UE5 內建 HTTP 模組 + 自訂 WebSocket**

- 使用 `FWebSocket` (UE5 內建)
- 需要 C++ 開發

---

## UE5 網路架構選擇

### 🎯 推薦架構：混合模式

```
┌─────────────────────────────────────────────┐
│              遊戲架構建議                      │
├─────────────────────────────────────────────┤
│                                             │
│  UE5 內建 Replication (Dedicated Server)    │
│  ├─ 玩家移動同步                              │
│  ├─ 戰鬥傷害計算                              │
│  ├─ 物品拾取                                 │
│  └─ 即時遊戲狀態                              │
│                                             │
│  WebSocket API (Node.js 後端)               │
│  ├─ 玩家登入/註冊                             │
│  ├─ 境界資料讀取                              │
│  ├─ 角色資料存檔                              │
│  ├─ 排行榜查詢                                │
│  └─ 商城交易                                 │
│                                             │
│  PostgreSQL                                 │
│  └─ 持久化資料儲存                            │
│                                             │
└─────────────────────────────────────────────┘
```

**為什麼這樣設計？**

- UE5 Replication 處理即時遊戲邏輯（秒級）
- WebSocket API 處理資料讀寫（非即時）
- 充分發揮兩者優勢

---

## WebSocket vs UE5 內建網路

### 比較表

| 功能           | UE5 Replication     | WebSocket            |
| -------------- | ------------------- | -------------------- |
| **即時性**     | ⭐⭐⭐⭐⭐ 極低延遲 | ⭐⭐⭐⭐ 低延遲      |
| **易用性**     | ⭐⭐⭐⭐ 藍圖友善   | ⭐⭐ 需要 C++        |
| **資料庫整合** | ⭐⭐ 較困難         | ⭐⭐⭐⭐⭐ 簡單      |
| **客製化**     | ⭐⭐⭐ 有限制       | ⭐⭐⭐⭐⭐ 完全自由  |
| **學習曲線**   | ⭐⭐⭐⭐ 中等       | ⭐⭐ 較陡            |
| **適用場景**   | 遊戲內即時互動      | 資料存取、非即時功能 |

---

## 實作步驟

### 📝 步驟一：設定 UE5 專案網路模式

#### 1. 建立新專案

```
File → New Project
→ Games → Third Person
→ With Starter Content
→ Enable C++ (重要！)
```

#### 2. 專案設定

```cpp
// DefaultEngine.ini
[/Script/Engine.GameNetworkManager]
bIsStandby=False
bIsStandbyCheckingEnabled=False

[OnlineSubsystem]
DefaultPlatformService=Null

[/Script/OnlineSubsystemUtils.IpNetDriver]
NetServerMaxTickRate=60
```

#### 3. 啟用多人遊戲

在編輯器中測試：

```
Play → Number of Players: 4
Play → Net Mode: Play as Listen Server
```

---

### 📝 步驟二：建立 WebSocket 連接（C++）

#### 1. 在 `YourProject.Build.cs` 加入模組

```csharp
PublicDependencyModuleNames.AddRange(new string[] {
    "Core",
    "CoreUObject",
    "Engine",
    "InputCore",
    "WebSockets",  // 加入這行
    "Json",        // 加入這行
    "JsonUtilities" // 加入這行
});
```

#### 2. 創建 WebSocket 管理類別

**WebSocketManager.h**

```cpp
#pragma once

#include "CoreMinimal.h"
#include "IWebSocket.h"
#include "WebSocketManager.generated.h"

UCLASS(Blueprintable, BlueprintType)
class IMMORTAL_API UWebSocketManager : public UObject
{
    GENERATED_BODY()

public:
    // 連接到 WebSocket 伺服器
    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void Connect(const FString& ServerURL);

    // 斷開連接
    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void Disconnect();

    // 發送訊息
    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void SendMessage(const FString& Message);

    // 檢查是否連接
    UFUNCTION(BlueprintPure, Category = "WebSocket")
    bool IsConnected() const;

private:
    TSharedPtr<IWebSocket> WebSocket;

    // 回調函數
    void OnConnected();
    void OnConnectionError(const FString& Error);
    void OnClosed(int32 StatusCode, const FString& Reason, bool bWasClean);
    void OnMessage(const FString& Message);
};
```

**WebSocketManager.cpp**

```cpp
#include "WebSocketManager.h"
#include "WebSocketsModule.h"

void UWebSocketManager::Connect(const FString& ServerURL)
{
    if (!FModuleManager::Get().IsModuleLoaded("WebSockets"))
    {
        FModuleManager::Get().LoadModule("WebSockets");
    }

    WebSocket = FWebSocketsModule::Get().CreateWebSocket(ServerURL);

    // 綁定事件
    WebSocket->OnConnected().AddUObject(this, &UWebSocketManager::OnConnected);
    WebSocket->OnConnectionError().AddUObject(this, &UWebSocketManager::OnConnectionError);
    WebSocket->OnClosed().AddUObject(this, &UWebSocketManager::OnClosed);
    WebSocket->OnMessage().AddUObject(this, &UWebSocketManager::OnMessage);

    // 開始連接
    WebSocket->Connect();
}

void UWebSocketManager::Disconnect()
{
    if (WebSocket.IsValid())
    {
        WebSocket->Close();
    }
}

void UWebSocketManager::SendMessage(const FString& Message)
{
    if (WebSocket.IsValid() && WebSocket->IsConnected())
    {
        WebSocket->Send(Message);
    }
}

bool UWebSocketManager::IsConnected() const
{
    return WebSocket.IsValid() && WebSocket->IsConnected();
}

void UWebSocketManager::OnConnected()
{
    UE_LOG(LogTemp, Log, TEXT("✅ WebSocket 連接成功"));
}

void UWebSocketManager::OnConnectionError(const FString& Error)
{
    UE_LOG(LogTemp, Error, TEXT("❌ WebSocket 連接錯誤: %s"), *Error);
}

void UWebSocketManager::OnClosed(int32 StatusCode, const FString& Reason, bool bWasClean)
{
    UE_LOG(LogTemp, Warning, TEXT("⚠️ WebSocket 已關閉: %s"), *Reason);
}

void UWebSocketManager::OnMessage(const FString& Message)
{
    UE_LOG(LogTemp, Log, TEXT("📩 收到訊息: %s"), *Message);

    // 在這裡解析 JSON 並處理遊戲邏輯
    // 例如：更新玩家境界資料
}
```

---

### 📝 步驟三：藍圖整合

#### 1. 創建藍圖類別

```
Content Browser 右鍵
→ Blueprint Class
→ 選擇 WebSocketManager
→ 命名為 BP_WebSocketManager
```

#### 2. 在 GameMode 中使用

**BP_GameMode（藍圖）：**

```
Event BeginPlay
  ├─ Create WebSocketManager (返回: WSManager)
  ├─ WSManager → Connect (ServerURL: "ws://localhost:3000")
  └─ Save WSManager to Variable
```

#### 3. 發送玩家資料範例

**獲取玩家境界：**

```
Event 獲取境界資料
  ├─ Make JSON String:
  │   {
  │     "type": "GET_PLAYER_REALM",
  │     "playerId": 12345
  │   }
  └─ WSManager → SendMessage
```

---

### 📝 步驟四：處理伺服器回應

**擴展 WebSocketManager.cpp 的 OnMessage：**

```cpp
void UWebSocketManager::OnMessage(const FString& Message)
{
    // 解析 JSON
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);

    if (FJsonSerializer::Deserialize(Reader, JsonObject))
    {
        FString Type = JsonObject->GetStringField("type");

        if (Type == "PLAYER_REALM")
        {
            // 處理境界資料
            TSharedPtr<FJsonObject> Data = JsonObject->GetObjectField("data");
            FString RealmName = Data->GetStringField("realm_name");
            int32 CurrentExp = Data->GetIntegerField("current_exp");

            // 觸發藍圖事件或更新 UI
            OnRealmDataReceived(RealmName, CurrentExp);
        }
    }
}
```

---

### 📝 步驟五：實作斷線重連

```cpp
// WebSocketManager.h 加入
UFUNCTION()
void AttemptReconnect();

private:
    FTimerHandle ReconnectTimer;
    int32 ReconnectAttempts = 0;
    const int32 MaxReconnectAttempts = 5;
    const float ReconnectDelay = 3.0f;

// WebSocketManager.cpp
void UWebSocketManager::OnClosed(int32 StatusCode, const FString& Reason, bool bWasClean)
{
    UE_LOG(LogTemp, Warning, TEXT("⚠️ WebSocket 已關閉，嘗試重連..."));

    if (ReconnectAttempts < MaxReconnectAttempts)
    {
        GetWorld()->GetTimerManager().SetTimer(
            ReconnectTimer,
            this,
            &UWebSocketManager::AttemptReconnect,
            ReconnectDelay,
            false
        );
    }
}

void UWebSocketManager::AttemptReconnect()
{
    ReconnectAttempts++;
    Connect(ServerURL); // 需要儲存 ServerURL
}
```

---

## 最佳實踐

### ✅ DO - 應該做的

1. **分離關注點**
   - UE5 Replication 處理即時遊戲邏輯
   - WebSocket 處理資料存取
   - 不要混用

2. **使用 JSON 格式**

   ```cpp
   // 統一的訊息格式
   {
     "type": "REQUEST_TYPE",
     "data": { ... },
     "timestamp": 1234567890
   }
   ```

3. **實作心跳機制**

   ```cpp
   // 每 30 秒發送心跳
   GetWorld()->GetTimerManager().SetTimer(
       HeartbeatTimer,
       []() {
           SendMessage("{\"type\":\"PING\"}");
       },
       30.0f,
       true
   );
   ```

4. **錯誤處理**
   - 總是檢查 `IsConnected()` 再發送
   - 實作重試機制
   - 記錄錯誤日誌

### ❌ DON'T - 不應該做的

1. **不要用 WebSocket 做即時遊戲同步**
   - 玩家位置、戰鬥傷害 → 用 UE5 Replication
   - 境界資料、存檔讀檔 → 用 WebSocket

2. **不要在每個 Tick 發送訊息**

   ```cpp
   // ❌ 錯誤：會導致伺服器超載
   void AMyActor::Tick(float DeltaTime)
   {
       SendMessage("Update position");
   }
   ```

3. **不要忘記斷線處理**
   - 必須實作重連邏輯
   - 保存未發送的訊息佇列

---

## 常見問題

### Q1: WebSocket 連接失敗怎麼辦？

**檢查清單：**

```
✅ Node.js 伺服器是否運行？
✅ 防火牆是否允許 port 3000？
✅ URL 格式是否正確？(ws://localhost:3000)
✅ UE5 是否啟用 WebSockets 模組？
```

**除錯方法：**

```cpp
// 加入詳細日誌
WebSocket->OnConnected().AddLambda([]()
{
    UE_LOG(LogTemp, Log, TEXT("✅ 連接成功"));
});

WebSocket->OnConnectionError().AddLambda([](const FString& Error)
{
    UE_LOG(LogTemp, Error, TEXT("❌ 錯誤: %s"), *Error);
});
```

---

### Q2: 如何在藍圖中使用 WebSocket？

**方法一：建立 Blueprint Function Library**

```cpp
UCLASS()
class UWebSocketBlueprintLibrary : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    static void SendRealmRequest(UWebSocketManager* Manager, int32 PlayerId);
};
```

**方法二：使用事件分發器**

```cpp
// 在 WebSocketManager.h
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnRealmDataReceived, FString, RealmName, int32, CurrentExp);

UPROPERTY(BlueprintAssignable, Category = "WebSocket")
FOnRealmDataReceived OnRealmDataReceived;
```

---

### Q3: 如何測試多人遊戲？

**本地測試（最簡單）：**

```
編輯器設定：
Play → Number of Players: 4
Play → Net Mode: Play as Listen Server
Play → 啟動
```

**專用伺服器測試：**

```bash
# 編譯專用伺服器
"C:\UE_5.3\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun ^
-project="C:\Projects\Immortal\Immortal.uproject" ^
-server -noclient -serverconfig=Development

# 啟動伺服器
ImmortalServer.exe -log

# 啟動客戶端
Immortal.exe 127.0.0.1
```

---

### Q4: WebSocket 和 HTTP API 的差異？

| 特性       | WebSocket        | HTTP API       |
| ---------- | ---------------- | -------------- |
| **連接**   | 持久連接         | 每次請求新連接 |
| **即時性** | 伺服器可主動推送 | 客戶端輪詢     |
| **開銷**   | 低（連接後）     | 高（每次建立） |
| **適用**   | 即時通訊、遊戲   | 資料查詢、CRUD |

**建議：**

- 玩家登入、資料查詢 → HTTP API (REST)
- 即時聊天、狀態推送 → WebSocket

---

### Q5: 如何優化 WebSocket 性能？

**1. 批次處理訊息**

```cpp
// 不要每次變化都發送
TArray<FString> MessageQueue;

void QueueMessage(const FString& Msg)
{
    MessageQueue.Add(Msg);
}

void SendBatch()
{
    if (MessageQueue.Num() > 0)
    {
        FString Batch = FString::Join(MessageQueue, TEXT(","));
        SendMessage(Batch);
        MessageQueue.Empty();
    }
}
```

**2. 壓縮資料**

```cpp
// 使用簡短的鍵名
// ❌ {"player_identifier": 12345, "experience_points": 50000}
// ✅ {"pid": 12345, "exp": 50000}
```

**3. 限制訊息頻率**

```cpp
float LastSendTime = 0.0f;
const float MinSendInterval = 0.1f; // 最快 100ms 發一次

void SendIfAllowed(const FString& Message)
{
    float CurrentTime = GetWorld()->GetTimeSeconds();
    if (CurrentTime - LastSendTime >= MinSendInterval)
    {
        SendMessage(Message);
        LastSendTime = CurrentTime;
    }
}
```

---

## 📚 延伸閱讀

**官方文檔：**

- [UE5 Networking Overview](https://docs.unrealengine.com/5.3/en-US/networking-overview-for-unreal-engine/)
- [UE5 Replication](https://docs.unrealengine.com/5.3/en-US/actor-replication-in-unreal-engine/)

**社群資源：**

- [Tom Looman's Multiplayer Guide](https://www.tomlooman.com/unreal-engine-multiplayer-tips-tricks/)
- [Cedric eXi's Networking Tutorials](https://cedric-neukirchen.net/)

**插件推薦：**

- VaRest (免費) - HTTP + WebSocket
- Advanced Sessions (免費) - Steam 整合

---

## 🎯 總結

**對於你的 4 人修仙 RPG 遊戲：**

```
推薦架構：
├─ UE5 Dedicated Server (Replication)
│   ├─ 玩家移動、戰鬥
│   └─ 即時互動
│
└─ Node.js WebSocket Server
    ├─ 境界資料 (PostgreSQL)
    ├─ 角色存檔
    └─ 排行榜、商城

開發順序：
1. 先用 UE5 內建網路做出基本多人遊戲
2. 用 HTTP API 整合境界系統資料
3. 進階功能再考慮 WebSocket
```

**記住：不要過早優化！先讓遊戲能跑起來。**

---

**下一步：**
想要看實際的程式碼範例？還是想要先測試 UE5 多人遊戲？
