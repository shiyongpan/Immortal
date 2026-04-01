const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// 在線玩家 Map: playerId -> WebSocket
const onlinePlayers = new Map();

function broadcast(data, excludePlayerId = null) {
  const msg = JSON.stringify(data);
  onlinePlayers.forEach((ws, pid) => {
    if (pid !== excludePlayerId && ws.readyState === 1) {
      ws.send(msg);
    }
  });
}

function sendToPlayer(playerId, data) {
  const ws = onlinePlayers.get(playerId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function setupWebSocket(wss) {
  wss.on("connection", (ws, req) => {
    logger.info("✅ 新 WebSocket 連接");

    ws.send(JSON.stringify({
      type: "WELCOME",
      message: "歡迎來到修仙世界！請發送 AUTH 訊息進行身份驗證。",
    }));

    ws.on("message", async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch {
        ws.send(JSON.stringify({ type: "ERROR", error: "訊息格式錯誤" }));
        return;
      }

      try {
        // AUTH 訊息無需已認證
        if (data.type === "AUTH") {
          await handleAuth(ws, data);
          return;
        }

        // 其他訊息需要已認證
        if (!ws.playerId) {
          ws.send(JSON.stringify({ type: "ERROR", error: "請先進行身份驗證" }));
          return;
        }

        switch (data.type) {
          case "PING":
            ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
            break;
          case "GET_REALM_DATA":
            await handleGetRealmData(ws);
            break;
          case "GET_PLAYER_REALM":
            await handleGetPlayerRealm(ws);
            break;
          case "BREAKTHROUGH":
            await handleBreakthrough(ws, data);
            break;
          case "CHAT_MESSAGE":
            await handleChatMessage(ws, data);
            break;
          case "GET_ONLINE_COUNT":
            ws.send(JSON.stringify({ type: "ONLINE_COUNT", count: onlinePlayers.size }));
            break;
          default:
            ws.send(JSON.stringify({ type: "ERROR", error: `未知訊息類型: ${data.type}` }));
        }
      } catch (error) {
        logger.error("WebSocket 處理錯誤:", error);
        ws.send(JSON.stringify({ type: "ERROR", error: "伺服器處理錯誤" }));
      }
    });

    ws.on("close", () => {
      if (ws.playerId) {
        onlinePlayers.delete(ws.playerId);
        broadcast({
          type: "PLAYER_OFFLINE",
          playerId: ws.playerId,
          onlineCount: onlinePlayers.size,
        });
        logger.info(`❌ 玩家 ${ws.playerId} 斷線，在線人數: ${onlinePlayers.size}`);
      }
    });

    ws.on("error", (err) => {
      logger.error("WebSocket 錯誤:", err.message);
    });
  });
}

async function handleAuth(ws, data) {
  const { token } = data;
  if (!token) {
    ws.send(JSON.stringify({ type: "AUTH_FAILED", error: "請提供 Token" }));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.playerId = decoded.playerId;
    ws.username = decoded.username;

    onlinePlayers.set(decoded.playerId, ws);

    ws.send(JSON.stringify({
      type: "AUTH_SUCCESS",
      playerId: decoded.playerId,
      username: decoded.username,
      onlineCount: onlinePlayers.size,
    }));

    broadcast({
      type: "PLAYER_ONLINE",
      playerId: decoded.playerId,
      username: decoded.username,
      onlineCount: onlinePlayers.size,
    }, decoded.playerId);

    logger.info(`✅ 玩家 ${decoded.username}(${decoded.playerId}) 上線，在線人數: ${onlinePlayers.size}`);
  } catch {
    ws.send(JSON.stringify({ type: "AUTH_FAILED", error: "Token 無效或已過期" }));
  }
}

async function handleGetRealmData(ws) {
  const result = await pool.query(
    `SELECT r.id, r.realm_name, r.realm_name_en, r.realm_order,
                json_agg(json_build_object(
                    'id', rs.id, 'stage_name', rs.stage_name,
                    'stage_order', rs.stage_order, 'is_extreme', rs.is_extreme,
                    'exp_required', rs.exp_required
                ) ORDER BY rs.stage_order) as stages
             FROM realms r
             LEFT JOIN realm_stages rs ON r.id = rs.realm_id
             GROUP BY r.id ORDER BY r.realm_order`,
  );
  ws.send(JSON.stringify({ type: "REALM_DATA", data: result.rows }));
}

async function handleGetPlayerRealm(ws) {
  const result = await pool.query(
    `SELECT pr.*, r.realm_name, rs.stage_name, rs.is_extreme, rs.exp_required
             FROM player_realms pr
             JOIN realms r ON pr.current_realm_id = r.id
             JOIN realm_stages rs ON pr.current_stage_id = rs.id
             WHERE pr.player_id = $1`,
    [ws.playerId],
  );
  ws.send(JSON.stringify({ type: "PLAYER_REALM", data: result.rows[0] || null }));
}

async function handleBreakthrough(ws, data) {
  const { useItem = false } = data;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const playerRealmResult = await client.query(
      `SELECT pr.*, rs.stage_order, rs.is_extreme, rs.exp_required, r.realm_order
               FROM player_realms pr
               JOIN realm_stages rs ON pr.current_stage_id = rs.id
               JOIN realms r ON pr.current_realm_id = r.id
               WHERE pr.player_id = $1`,
      [ws.playerId],
    );

    if (playerRealmResult.rows.length === 0) {
      ws.send(JSON.stringify({ type: "BREAKTHROUGH_RESULT", success: false, error: "找不到境界資料" }));
      await client.query("ROLLBACK");
      return;
    }

    const playerRealm = playerRealmResult.rows[0];

    if (BigInt(playerRealm.current_exp) < BigInt(playerRealm.exp_required)) {
      ws.send(JSON.stringify({
        type: "BREAKTHROUGH_RESULT", success: false,
        error: "修為不足", required: playerRealm.exp_required.toString(),
      }));
      await client.query("ROLLBACK");
      return;
    }

    let successRate = playerRealm.is_extreme ? (useItem ? 80 : 50) : 100;
    const success = Math.random() * 100 < successRate;

    let nextStageId = null;
    let nextRealmId = playerRealm.current_realm_id;

    if (success) {
      const nextStage = await client.query(
        `SELECT id FROM realm_stages WHERE realm_id = $1 AND stage_order = $2 LIMIT 1`,
        [playerRealm.current_realm_id, playerRealm.stage_order + 1],
      );
      if (nextStage.rows.length > 0) {
        nextStageId = nextStage.rows[0].id;
      } else {
        const nextRealm = await client.query(
          `SELECT id FROM realms WHERE realm_order = $1 LIMIT 1`,
          [playerRealm.realm_order + 1],
        );
        if (nextRealm.rows.length > 0) {
          nextRealmId = nextRealm.rows[0].id;
          const firstStage = await client.query(
            `SELECT id FROM realm_stages WHERE realm_id = $1 AND stage_order = 1 LIMIT 1`,
            [nextRealmId],
          );
          if (firstStage.rows.length > 0) nextStageId = firstStage.rows[0].id;
        }
      }

      if (nextStageId) {
        await client.query(
          `UPDATE player_realms SET current_realm_id = $1, current_stage_id = $2,
                     current_exp = 0, total_breakthroughs = total_breakthroughs + 1,
                     last_breakthrough_at = NOW(), updated_at = NOW()
                     WHERE player_id = $3`,
          [nextRealmId, nextStageId, ws.playerId],
        );
      }
    } else {
      const expLoss = Math.floor(Number(playerRealm.exp_required) * 0.3);
      await client.query(
        `UPDATE player_realms SET current_exp = GREATEST(0, current_exp - $1),
                   failed_breakthroughs = failed_breakthroughs + 1, updated_at = NOW()
                   WHERE player_id = $2`,
        [expLoss, ws.playerId],
      );
    }

    await client.query(
      `INSERT INTO player_realm_history (player_id, from_stage_id, to_stage_id, success, is_extreme)
               VALUES ($1, $2, $3, $4, $5)`,
      [ws.playerId, playerRealm.current_stage_id, nextStageId, success, playerRealm.is_extreme],
    );

    await client.query("COMMIT");

    const resultMsg = {
      type: "BREAKTHROUGH_RESULT",
      success,
      message: success ? "突破成功！境界晉升！" : "突破失敗...",
      successRate,
    };

    ws.send(JSON.stringify(resultMsg));

    if (success) {
      broadcast({
        type: "REALM_BREAKTHROUGH",
        playerId: ws.playerId,
        username: ws.username,
        message: `${ws.username} 突破境界成功！`,
      });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error("WS 突破錯誤:", error);
    ws.send(JSON.stringify({ type: "ERROR", error: "突破處理失敗" }));
  } finally {
    client.release();
  }
}

async function handleChatMessage(ws, data) {
  const { message } = data;
  if (!message || message.trim().length === 0) return;

  const trimmed = message.trim().slice(0, 200);
  broadcast({
    type: "CHAT_MESSAGE",
    playerId: ws.playerId,
    username: ws.username,
    message: trimmed,
    timestamp: Date.now(),
  });
}

module.exports = { setupWebSocket, broadcast, sendToPlayer };
