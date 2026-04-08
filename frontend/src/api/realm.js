import client from "./client";

export const realmApi = {
  getAll: () => client.get("/realms"),
  getPlayer: () => client.get("/realms/player"),
  addExp: (amount) => client.post("/realms/player/add-exp", { amount }),
  breakthrough: (opts = {}) => client.post("/realms/player/breakthrough", opts),
  getHistory: () => client.get("/realms/player/history"),
  getRequirements: () => client.get("/realms/player/requirements"),
  cultivate: () => client.post("/realms/player/cultivate", {}),
};
