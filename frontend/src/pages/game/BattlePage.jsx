import { useEffect, useState, useCallback, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { battleApi } from "../../api/battle";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ActionBattle from "../../components/battle/ActionBattle";

export default function BattlePage() {
  const { player, refreshPlayer } = useAuth();
  const monsters = useApi(battleApi.getMonsters);
  const logs = useApi(battleApi.getLogs);
  const [battleResult, setBattleResult] = useState(null);
  const [fighting, setFighting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  // action mode
  const [actionTarget, setActionTarget] = useState(null); // monster object to fight in action mode
  const actionTargetRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    monsters.execute();
    logs.execute();
  }, []);

  // Classic (turn-based) fight
  const fight = async (monsterId) => {
    setFighting(true);
    setBattleResult(null);
    try {
      const res = await battleApi.start(monsterId);
      setBattleResult(res.data);
      logs.execute();
      refreshPlayer();
    } catch (err) {
      setBattleResult({ result: "error", message: err.error || "戰鬥失敗" });
    } finally {
      setFighting(false);
    }
  };

  const restoreHp = async () => {
    setRestoring(true);
    try {
      await battleApi.restoreHp();
      refreshPlayer();
    } catch (err) {
      alert(err.error || "回復失敗");
    } finally {
      setRestoring(false);
    }
  };

  // Called when ActionBattle ends; data has finalHp/finalMp; wins also have kills/expGained/stonesGained
  const handleActionFinish = useCallback(async (data) => {
    const target = actionTargetRef.current;
    setActionTarget(null);
    actionTargetRef.current = null;
    const isWin = !!(data && data.kills !== undefined);

    setSubmitting(true);
    try {
      const res = await battleApi.submitActionResult({
        monsterId: target?.id,
        kills: data?.kills ?? 0,
        expGained: data?.expGained ?? 0,
        stonesGained: data?.stonesGained ?? 0,
        finalHp: data?.finalHp ?? 0,
        finalMp: data?.finalMp ?? 0,
        isWin,
      });
      setBattleResult({
        result: isWin ? "win" : "lose",
        message: isWin ? `✦ 戰鬥勝利！擊殺 ${data.kills} 隻妖獸` : "道心蒙塵，敗北而歸...",
        expGained: res.data.expGained,
        spiritStonesGained: res.data.spiritStonesGained,
      });
    } catch (err) {
      setBattleResult({ result: isWin ? "win" : "lose", message: isWin ? "✦ 戰鬥勝利" : "道心蒙塵，敗北而歸..." });
    } finally {
      setSubmitting(false);
      logs.execute();
      refreshPlayer();
    }
  }, [logs, refreshPlayer]);

  const RESULT_STYLE = {
    win: "bg-yellow-900/30 border-yellow-700 text-yellow-300",
    lose: "bg-red-900/30 border-red-800 text-red-300",
    flee: "bg-gray-800 border-gray-700 text-gray-300",
    error: "bg-red-900/30 border-red-800 text-red-300",
  };

  // ── Action battle full-screen overlay ──
  if (actionTarget) {
    const monsterList = Array.isArray(actionTarget) ? actionTarget : [actionTarget];
    const stats = player || {};
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-yellow-400 text-lg font-bold">
            ⚔ 動作戰鬥 — {monsterList.map((m) => m.monster_name).join(" + ")}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => { actionTargetRef.current = null; setActionTarget(null); }}>退出戰鬥</Button>
        </div>
        <ActionBattle
          monsters={monsterList}
          playerStats={stats}
          onFinish={handleActionFinish}
        />
        {submitting && <div className="text-center text-yellow-400 text-sm animate-pulse">提交戰鬥結果中...</div>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-yellow-400 text-xl font-bold border-l-2 border-yellow-500 pl-3">戰鬥挑戰</h1>
        <Button onClick={restoreHp} loading={restoring} variant="secondary" size="sm">回復 HP（消耗靈石）</Button>
      </div>

      {/* 戰鬥結果 */}
      {battleResult && (
        <div className={`p-4 rounded border ${RESULT_STYLE[battleResult.result] || RESULT_STYLE.error}`}>
          <div className="font-semibold text-lg mb-2">{battleResult.message}</div>
          {battleResult.result === "win" && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <span>獲得修為 +{battleResult.expGained}</span>
              <span>靈石 +{battleResult.spiritStonesGained}</span>
              {battleResult.rounds && <span>回合數 {battleResult.rounds}</span>}
            </div>
          )}
          {battleResult.battleDetail?.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto space-y-0.5">
              {battleResult.battleDetail.map((r) => (
                <div key={r.round} className="text-xs text-gray-400 flex gap-3">
                  <span className="text-gray-600">R{r.round}</span>
                  <span className={r.playerCrit ? "text-yellow-400" : "text-blue-400"}>
                    我方 -{r.playerDmg}{r.playerCrit ? " 暴擊!" : ""}
                  </span>
                  {r.monsterDmg !== undefined && <span className="text-red-400">受傷 -{r.monsterDmg}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 怪物列表 */}
      <Card title="可挑戰的妖獸">
        {monsters.loading ? (
          <div className="text-gray-500 text-center py-4">載入中...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(monsters.data?.monsters || []).map((m) => (
              <div key={m.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-yellow-800/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-gray-200 font-semibold text-sm">{m.monster_name}</div>
                    <div className="text-gray-500 text-xs mt-0.5">Lv.{m.level} · HP {m.max_hp}</div>
                    <div className="text-gray-600 text-xs mt-1">
                      攻 {m.attack} / 防 {m.defense} / 速 {m.speed}
                    </div>
                    <div className="text-yellow-600 text-xs mt-1">
                      修為 +{m.exp_reward} · 靈石 +{m.spirit_stone_reward}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button onClick={() => fight(m.id)} loading={fighting} size="sm">回合制</Button>
                    <Button onClick={() => { actionTargetRef.current = m; setActionTarget(m); }} variant="purple" size="sm">⚔ 動作戰</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 戰鬥記錄 */}
      <Card title="近期戰績">
        {logs.data?.logs?.length > 0 ? (
          <div className="space-y-1.5">
            {logs.data.logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-800">
                <span className={l.result === "win" ? "text-yellow-400" : l.result === "flee" ? "text-gray-400" : "text-red-400"}>
                  {l.result === "win" ? "✦ 勝利" : l.result === "flee" ? "→ 逃跑" : "✗ 失敗"}
                </span>
                <span className="text-gray-300">{l.monster_name}</span>
                <span className="text-yellow-600">+{l.exp_gained} 修為</span>
                <span className="text-gray-600">{new Date(l.fought_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-3 text-sm">尚無戰鬥記錄</div>
        )}
      </Card>
    </div>
  );
}
