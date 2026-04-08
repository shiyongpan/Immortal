import client from "./client";

export const skillApi = {
  getAvailable: () => client.get("/skills/available"),
  getPlayer: () => client.get("/skills/player"),
  learn: (skillId) => client.post("/skills/learn", { skillId }),
  upgrade: (playerSkillId) => client.post("/skills/upgrade", { playerSkillId }),
  setSlot: (playerSkillId, slotNumber) => client.post("/skills/slot", { playerSkillId, slotNumber }),
};
