/**
 * 任務自動進度更新單元測試
 * updateQuestProgress(client, playerId, stepType, targetId, incrementBy)
 * 以假的 pg client 控制查詢結果。
 */
const { updateQuestProgress } = require("../../src/utils/questProgress");
const logger = require("../../src/utils/logger");

function makeClient() {
  return { query: jest.fn() };
}

afterEach(() => jest.clearAllMocks());

describe("updateQuestProgress", () => {
  test("沒有符合的進行中任務時不更新", async () => {
    const client = makeClient();
    client.query.mockResolvedValueOnce({ rows: [] }); // SELECT 無結果

    await updateQuestProgress(client, 1, "kill", 10, 1);

    expect(client.query).toHaveBeenCalledTimes(1); // 只有 SELECT，無 UPDATE
  });

  test("有符合任務時累加進度並寫回（從 0 開始）", async () => {
    const client = makeClient();
    client.query
      .mockResolvedValueOnce({
        rows: [{ pq_id: 99, step_progress: {}, step_order: 1, required_count: 5 }],
      })
      .mockResolvedValueOnce({}); // UPDATE

    await updateQuestProgress(client, 1, "kill", 10, 2);

    expect(client.query).toHaveBeenCalledTimes(2);
    const updateCall = client.query.mock.calls[1];
    // 第二次呼叫為 UPDATE，參數 [JSON, pq_id]
    expect(JSON.parse(updateCall[1][0])).toEqual({ step_1: 2 });
    expect(updateCall[1][1]).toBe(99);
  });

  test("進度累加在既有值之上", async () => {
    const client = makeClient();
    client.query
      .mockResolvedValueOnce({
        rows: [{ pq_id: 7, step_progress: { step_2: 3 }, step_order: 2, required_count: 10 }],
      })
      .mockResolvedValueOnce({});

    await updateQuestProgress(client, 1, "collect", 20, 4);

    const updateCall = client.query.mock.calls[1];
    expect(JSON.parse(updateCall[1][0])).toEqual({ step_2: 7 });
  });

  test("進度不超過 required_count（上限封頂）", async () => {
    const client = makeClient();
    client.query
      .mockResolvedValueOnce({
        rows: [{ pq_id: 7, step_progress: { step_1: 4 }, step_order: 1, required_count: 5 }],
      })
      .mockResolvedValueOnce({});

    await updateQuestProgress(client, 1, "kill", 10, 100); // 大幅增加

    const updateCall = client.query.mock.calls[1];
    expect(JSON.parse(updateCall[1][0])).toEqual({ step_1: 5 }); // 封頂在 5
  });

  test("已達上限的步驟直接跳過，不發送 UPDATE", async () => {
    const client = makeClient();
    client.query.mockResolvedValueOnce({
      rows: [{ pq_id: 7, step_progress: { step_1: 5 }, step_order: 1, required_count: 5 }],
    });

    await updateQuestProgress(client, 1, "kill", 10, 1);

    expect(client.query).toHaveBeenCalledTimes(1); // 只有 SELECT
  });

  test("incrementBy 預設為 1", async () => {
    const client = makeClient();
    client.query
      .mockResolvedValueOnce({
        rows: [{ pq_id: 7, step_progress: {}, step_order: 1, required_count: 5 }],
      })
      .mockResolvedValueOnce({});

    await updateQuestProgress(client, 1, "kill", 10); // 不帶 incrementBy

    const updateCall = client.query.mock.calls[1];
    expect(JSON.parse(updateCall[1][0])).toEqual({ step_1: 1 });
  });

  test("查詢出錯時吞掉錯誤並記 log，不向外拋出", async () => {
    const client = makeClient();
    client.query.mockRejectedValueOnce(new Error("db boom"));

    await expect(updateQuestProgress(client, 1, "kill", 10, 1)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
