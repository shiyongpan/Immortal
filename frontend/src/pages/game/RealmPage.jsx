import { useEffect, useState, useRef, useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import { realmApi } from "../../api/realm";
import { inventoryApi } from "../../api/inventory";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";
import { formatNumber } from "../../utils/format";

// 每境界自動修練速率（每分鐘修為）
const CULTIVATION_RATE = {
  "築基境": 50,
  "金丹境": 500,
  "元嬰境": 5000,
  "化神境": 50000,
};

// 突破類型對應顯示
const BT_TYPE_LABEL = {
  major:   { label: "大境界突破", color: "text-yellow-300", bg: "bg-yellow-900/30 border-yellow-600" },
  extreme: { label: "極境突破",   color: "text-purple-300", bg: "bg-purple-900/30 border-purple-700" },
  normal:  { label: "境界晉升",   color: "text-green-300",  bg: "bg-green-900/30 border-green-700"  },
};

// 天材地寶 item_id = 71；每境界極境需要 realm_order 個
const TIANDI_ITEM_ID = 71;

// 各境界突破丹藥（realm_order → { item_id, name }）
const BREAKTHROUGH_PILL = {
  1: { id: 43, name: "聚靈丹" },
  2: { id: 44, name: "築基丹" },
  3: { id: 45, name: "結金丹" },
  4: { id: 46, name: "破嬰丹" },
  5: { id: 47, name: "化神丹" },
};

export default function RealmPage() {
  const { refreshPlayer } = useAuth();
  const playerRealm = useApi(realmApi.getPlayer);
  const allRealms = useApi(realmApi.getAll);
  const history = useApi(realmApi.getHistory);
  const inventory = useApi(inventoryApi.getAll);
  const [btResult, setBtResult] = useState(null);
  const [btLoading, setBtLoading] = useState(false);
  const [cultivateMsg, setCultivateMsg] = useState(null);
  const cultivateTimerRef = useRef(null);

  useEffect(() => {
    playerRealm.execute();
    allRealms.execute();
    history.execute();
    inventory.execute();
  }, []);

  // 自動修練：每 60 秒呼叫一次後端累算修為
  const triggerCultivate = useCallback(async () => {
    try {
      const res = await realmApi.cultivate();
      const { gained, currentExp, ratePerMin } = res.data;
      if (gained > 0) {
        setCultivateMsg(`自動修練 +${formatNumber(gained)} 修為`);
        setTimeout(() => setCultivateMsg(null), 4000);
        playerRealm.execute();
        refreshPlayer();
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    // 立刻執行一次（補算離線修為）
    triggerCultivate();

    // 之後每 60 秒自動修練
    cultivateTimerRef.current = setInterval(triggerCultivate, 60_000);
    return () => clearInterval(cultivateTimerRef.current);
  }, [triggerCultivate]);

  const r = playerRealm.data?.realm;
  const ratePerMin = r ? (CULTIVATION_RATE[r.realm_name] ?? 0) : 0;
  const canCultivate = ratePerMin > 0;

  const doBreakthrough = async (opts = {}) => {
    setBtLoading(true);
    setBtResult(null);
    try {
      const res = await realmApi.breakthrough(opts);
      setBtResult(res.data);
      playerRealm.execute();
      history.execute();
      inventory.execute();
      refreshPlayer();
    } catch (err) {
      setBtResult({ success: false, message: err?.response?.data?.error || err.error || "突破失敗" });
    } finally {
      setBtLoading(false);
    }
  };

  const canBreakthrough = r && BigInt(r.current_exp ?? 0) >= BigInt(r.exp_required ?? 999999999);
  const expPct = r ? Math.min(100, Math.round((Number(r.current_exp) / Number(r.exp_required)) * 100)) : 0;
  const btTypeInfo = btResult?.breakthroughType ? BT_TYPE_LABEL[btResult.breakthroughType] : null;

  // 巔峰判斷：stage_order=4 且非極境
  const isAtPeak = r && r.stage_order === 4 && !r.is_extreme;

  // 天材地寶持有數量
  const tiandiOwned = (inventory.data?.items || []).find(
    (i) => i.item_id === TIANDI_ITEM_ID,
  )?.quantity ?? 0;
  const tiandiRequired = r ? (r.realm_order ?? 1) : 1;
  const hasTiandi = tiandiOwned >= tiandiRequired;

  // 突破丹藥
  const pillInfo = r ? BREAKTHROUGH_PILL[r.realm_order] : null;
  const pillOwned = pillInfo
    ? (inventory.data?.items || []).find((i) => i.item_id === pillInfo.id)?.quantity ?? 0
    : 0;
  const hasPill = pillOwned > 0;

  return (
    <div className="space-y-5">
      <h1 className="text-yellow-400 text-xl font-bold border-l-2 border-yellow-500 pl-3">境界突破</h1>

      {/* 當前境界 */}
      {r ? (
        <Card title="當前境界">
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-yellow-400 text-2xl font-bold">{r.realm_name}</span>
              <span className="text-purple-300 text-lg">{r.stage_name}</span>
              {r.is_extreme && <span className="text-xs px-2 py-0.5 bg-red-900/50 border border-red-700 rounded text-red-300">極境關卡</span>}
            </div>

            <div>
              <ProgressBar
                label="境界修為"
                value={Number(r.current_exp)}
                max={Number(r.exp_required)}
                color="yellow"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                <span>{formatNumber(r.current_exp)} / {formatNumber(r.exp_required)}</span>
                <span>{expPct}%</span>
              </div>
            </div>

            {/* 自動修練顯示 */}
            {canCultivate && (
              <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-900/20 border border-cyan-800/50 rounded px-3 py-2">
                <span className="animate-pulse">◉</span>
                <span>自動修練中 · {formatNumber(ratePerMin)} 修為/分鐘</span>
                {cultivateMsg && <span className="ml-auto text-green-400">{cultivateMsg}</span>}
              </div>
            )}
            {!canCultivate && (
              <div className="text-xs text-gray-600 bg-gray-800/50 rounded px-3 py-2">
                ○ 自動修練功法未覺醒（需達築基境）
              </div>
            )}

            {/* 突破結果 */}
            {btResult && (
              <div className={`p-3 rounded border text-sm ${btResult.success
                ? (btTypeInfo?.bg ?? "bg-yellow-900/30 border-yellow-700")
                : "bg-red-900/30 border-red-800"}`}>
                <div className={`font-semibold mb-0.5 ${btResult.success ? (btTypeInfo?.color ?? "text-yellow-300") : "text-red-300"}`}>
                  {btResult.success ? `✦ ${btTypeInfo?.label ?? "突破成功"}` : "✗ 突破失敗"}
                </div>
                <div className="text-gray-300">{btResult.message}</div>
                {btResult.successRate < 100 && <span className="text-gray-400 text-xs">成功率 {btResult.successRate}%</span>}
              </div>
            )}

            {/* ── 巔峰：雙路選擇 ── */}
            {isAtPeak ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 bg-gray-800/60 rounded p-3 border border-gray-700">
                  <div className="font-semibold text-yellow-400 mb-1">⚖ 巔峰岔路</div>
                  <div>① 踏入<span className="text-red-400 font-semibold">極境</span>（需 <span className={hasTiandi ? "text-green-400" : "text-red-400"}>{tiandiOwned}/{tiandiRequired}</span> 天材地寶）— 獲得中幅屬性成長，日後再突破大境界</div>
                  <div className="mt-1">② <span className="text-blue-400 font-semibold">直入下個境界</span>（無需特殊物品）— 跳過極境，直接突破，但少了極境加成</div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => doBreakthrough({ skipExtreme: false })}
                    loading={btLoading}
                    disabled={!canBreakthrough || !hasTiandi}
                    variant={canBreakthrough && hasTiandi ? "primary" : "secondary"}
                  >
                    {hasTiandi ? "踏入極境" : `天材地寶不足（${tiandiOwned}/${tiandiRequired}）`}
                  </Button>
                  <Button
                    onClick={() => doBreakthrough({ skipExtreme: true })}
                    loading={btLoading}
                    disabled={!canBreakthrough}
                    variant={canBreakthrough ? "secondary" : "secondary"}
                  >
                    直入下境界 →
                  </Button>
                </div>
              </div>
            ) : r.is_extreme ? (
              /* ── 極境：突破大境界 ── */
              (() => {
                const extremeStoneOwned = (inventory.data?.items || []).find(i => i.item_id === 72)?.quantity ?? 0;
                return (
                  <div className="space-y-3">
                    <div className="text-xs text-amber-400/80 bg-amber-900/20 border border-amber-800/50 rounded px-3 py-2">
                      ⚠ 極境突破至大境界有失敗風險（基礎 50%）
                      <br/>丹藥（築基丹等）+30%・極境靈石 +25%・可疊加（上限 95%）
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={() => doBreakthrough({ useItem: false })} loading={btLoading}
                        disabled={!canBreakthrough} variant={canBreakthrough ? "primary" : "secondary"}>
                        {canBreakthrough ? "衝擊大境界（50%）" : "修為不足"}
                      </Button>
                      <Button onClick={() => doBreakthrough({ useItem: true })} loading={btLoading}
                        disabled={!canBreakthrough || !hasPill} variant={hasPill ? "purple" : "secondary"}>
                        {hasPill
                          ? `${pillInfo?.name}輔助（80%）×${pillOwned}`
                          : `無${pillInfo?.name}（80%）`}
                      </Button>
                      {extremeStoneOwned > 0 && (
                        <Button onClick={() => doBreakthrough({ useExtremeStone: true })} loading={btLoading}
                          disabled={!canBreakthrough} variant="secondary">
                          極境靈石（75%）x{extremeStoneOwned}
                        </Button>
                      )}
                      {extremeStoneOwned > 0 && hasPill && (
                        <Button onClick={() => doBreakthrough({ useItem: true, useExtremeStone: true })} loading={btLoading}
                          disabled={!canBreakthrough} variant="purple">
                          全力一擊（95%）
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* ── 普通階段 ── */
              <Button
                onClick={() => doBreakthrough({})}
                loading={btLoading}
                disabled={!canBreakthrough}
                variant={canBreakthrough ? "primary" : "secondary"}
              >
                {canBreakthrough ? "突破境界（100%）" : "修為不足"}
              </Button>
            )}

            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-400">突破次數</div>
                <div className="text-yellow-400 font-bold mt-1">{r.total_breakthroughs ?? 0}</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-400">失敗次數</div>
                <div className="text-red-400 font-bold mt-1">{r.failed_breakthroughs ?? 0}</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-400">突破成功率</div>
                <div className="text-purple-400 font-bold mt-1">{r.is_extreme ? "50%" : "100%"}</div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card><div className="text-gray-500 text-center py-4">載入境界資料中...</div></Card>
      )}

      {/* 境界體系 */}
      {allRealms.data?.realms && (
        <Card title="修仙境界體系">
          <div className="space-y-2">
            {allRealms.data.realms.map((realm) => {
              const isCurrent = r?.realm_name === realm.realm_name;
              const cultivationRate = CULTIVATION_RATE[realm.realm_name];
              return (
                <div
                  key={realm.id}
                  className={`p-3 rounded border ${isCurrent ? "border-yellow-600 bg-yellow-900/20" : "border-gray-800 bg-gray-800/50"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm ${isCurrent ? "text-yellow-400" : "text-gray-300"}`}>
                      {realm.realm_name}
                    </span>
                    <span className="text-gray-600 text-xs">{realm.realm_name_en}</span>
                    {isCurrent && <span className="text-xs px-1.5 py-0.5 bg-yellow-800 rounded text-yellow-300">當前</span>}
                    {cultivationRate && (
                      <span className="text-xs text-cyan-600 ml-auto">⚡ {formatNumber(cultivationRate)}/分</span>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(realm.stages || []).map((s) => (
                      <span
                        key={s.id}
                        className={`text-xs px-2 py-0.5 rounded ${
                          r?.stage_name === s.stage_name && isCurrent
                            ? "bg-yellow-700 text-yellow-200"
                            : s.is_extreme
                            ? "bg-red-900/50 border border-red-800 text-red-300"
                            : "bg-gray-700 text-gray-400"
                        }`}
                      >
                        {s.stage_name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 突破歷史 */}
      {history.data?.history?.length > 0 && (
        <Card title="突破歷史">
          <div className="space-y-1.5">
            {history.data.history.slice(0, 10).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-800">
                <span className={h.success ? "text-yellow-400" : "text-red-400"}>
                  {h.success ? "✦ 成功" : "✗ 失敗"}
                </span>
                <span className="text-gray-400">{h.from_stage_name} → {h.to_stage_name || "—"}</span>
                <span className="text-gray-600">{new Date(h.breakthrough_time).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
