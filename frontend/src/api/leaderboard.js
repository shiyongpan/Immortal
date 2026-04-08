import client from "./client";

export const leaderboardApi = {
  get: (type) => client.get(`/leaderboard/${type}`),
  getMe: (type) => client.get(`/leaderboard/${type}/me`),
};
