import client from "./client";

export const questApi = {
  getAvailable: () => client.get("/quests/available"),
  getPlayer: (status = "in_progress") => client.get(`/quests/player?status=${status}`),
  accept: (questId) => client.post("/quests/accept", { questId }),
  complete: (questId) => client.post("/quests/complete", { questId }),
  abandon: (questId) => client.post("/quests/abandon", { questId }),
};
