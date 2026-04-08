import client from "./client";

export const battleApi = {
  getMonsters: () => client.get("/battle/monsters"),
  start: (monsterId) => client.post("/battle/start", { monsterId }),
  getLogs: (limit = 20) => client.get(`/battle/logs?limit=${limit}`),
  restoreHp: () => client.post("/battle/restore-hp"),
  syncHp: (currentHp, currentMp) => client.post("/battle/sync-hp", { currentHp, currentMp }),
  submitActionResult: (payload) => client.post("/battle/action-result", payload),
};
