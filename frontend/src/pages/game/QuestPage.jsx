import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { questApi } from "../../api/quest";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { formatNumber } from "../../utils/format";

const QUEST_TYPE_LABEL = { main: "主線", side: "支線", daily: "日常", event: "活動" };
const QUEST_TYPE_COLOR = {
  main: "text-yellow-400 bg-yellow-900/30 border-yellow-800",
  side: "text-blue-400 bg-blue-900/30 border-blue-800",
  daily: "text-green-400 bg-green-900/30 border-green-800",
  event: "text-purple-400 bg-purple-900/30 border-purple-800",
};

// 獎勵文字
function rewardLabel(r) {
  if (r.reward_type === "exp") return `修為 ×${formatNumber(r.reward_value)}`;
  if (r.reward_type === "spirit_stones") return `靈石 ×${formatNumber(r.reward_value)}`;
  if (r.reward_type === "immortal_jade") return `仙玉 ×${formatNumber(r.reward_value)}`;
  if (r.reward_type === "honor_points") return `榮譽 ×${formatNumber(r.reward_value)}`;
  if (r.reward_type === "contribution_points") return `貢獻 ×${formatNumber(r.reward_value)}`;
  if (r.reward_type === "item") return `${r.item_name || "道具"} ×${r.item_quantity || 1}`;
  return `${r.reward_type} ×${r.reward_value}`;
}
function rewardColor(type) {
  if (type === "exp") return "text-cyan-400";
  if (type === "spirit_stones") return "text-yellow-400";
  if (type === "immortal_jade") return "text-teal-400";
  if (type === "honor_points") return "text-purple-400";
  if (type === "contribution_points") return "text-green-400";
  if (type === "item") return "text-blue-400";
  return "text-gray-400";
}

function cooldownRemaining(completedAt, cooldownHours) {
  if (!completedAt || !cooldownHours) return null;
  const readyAt = new Date(completedAt).getTime() + cooldownHours * 3600000;
  const diffMs = readyAt - Date.now();
  if (diffMs <= 0) return null;
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return h > 0 ? `${h} 小時 ${m} 分後可再接` : `${m} 分後可再接`;
}

// 步驟進度條
function StepProgress({ steps, stepProgress, currentStep }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {steps.map((s) => {
        const key = `step_${s.step_order}`;
        const done = (stepProgress?.[key] || 0);
        const pct = Math.min(1, done / s.required_count);
        const isComplete = done >= s.required_count;
        return (
          <div key={s.id}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className={isComplete ? "text-green-400" : "text-gray-400"}>
                {isComplete ? "✓ " : ""}{s.description}
              </span>
              <span className={isComplete ? "text-green-400" : "text-gray-500"}>
                {done}/{s.required_count}
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-yellow-600"}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function QuestPage() {
  const { refreshPlayer } = useAuth();
  const available = useApi(questApi.getAvailable);
  const playerQuests = useApi(questApi.getPlayer);
  const [tab, setTab] = useState("active");
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [acting, setActing] = useState(null);

  useEffect(() => { available.execute(); playerQuests.execute(); }, []);

  const notify = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: "", ok: true }), 3500);
  };

  const accept = async (questId) => {
    setActing(questId);
    try {
      const r = await questApi.accept(questId);
      notify(r.data.message || "接取成功");
      await Promise.all([playerQuests.execute(), available.execute()]);
      setTab("active");
    } catch (err) { notify(err.error || "接取失敗", false); }
    finally { setActing(null); }
  };

  const complete = async (questId) => {
    setActing(questId);
    try {
      const r = await questApi.complete(questId);
      notify(r.data.message || "任務完成！獎勵已發放");
      await Promise.all([playerQuests.execute(), refreshPlayer()]);
    } catch (err) { notify(err.error || "完成失敗", false); }
    finally { setActing(null); }
  };

  const abandon = async (questId) => {
    if (!confirm("確定要放棄這個任務嗎？")) return;
    setActing(questId);
    try {
      await questApi.abandon(questId);
      notify("已放棄任務");
      await Promise.all([playerQuests.execute(), available.execute()]);
    } catch (err) { notify(err.error || "放棄失敗", false); }
    finally { setActing(null); }
  };

  // 當 tab 是 completed 時抓完成的任務
  useEffect(() => {
    if (tab === "completed") playerQuests.execute("completed");
    else playerQuests.execute("in_progress");
  }, [tab]);

  const quests = playerQuests.data?.quests || [];
  const avail = available.data?.quests || [];
  const activeCount = quests.filter((q) => q.status === "in_progress").length;

  return (
    <div className="space-y-4">
      <h1 className="text-yellow-400 text-xl font-bold border-l-2 border-yellow-500 pl-3">宗門任務</h1>

      {msg.text && (
        <div className={`rounded px-3 py-2 text-sm border ${msg.ok ? "bg-yellow-900/20 border-yellow-800 text-yellow-300" : "bg-red-900/20 border-red-800 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {/* Tab */}
      <div className="flex gap-2">
        <Button onClick={() => setTab("active")} variant={tab === "active" ? "primary" : "secondary"} size="sm">
          進行中 {activeCount > 0 && `(${activeCount})`}
        </Button>
        <Button onClick={() => setTab("available")} variant={tab === "available" ? "primary" : "secondary"} size="sm">
          可接取 {avail.length > 0 && `(${avail.length})`}
        </Button>
        <Button onClick={() => setTab("completed")} variant={tab === "completed" ? "primary" : "secondary"} size="sm">
          已完成
        </Button>
      </div>

      {/* 進行中 */}
      {tab === "active" && (
        <div className="space-y-3">
          {quests.map((q) => {
            const allStepsDone = !q.steps || q.steps.length === 0 ||
              q.steps.every((s) => (q.step_progress?.[`step_${s.step_order}`] || 0) >= s.required_count);

            return (
              <Card key={q.id}>
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-200 font-semibold">{q.quest_name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${QUEST_TYPE_COLOR[q.quest_type] || "text-gray-400 bg-gray-800 border-gray-700"}`}>
                          {QUEST_TYPE_LABEL[q.quest_type] || q.quest_type}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{q.description}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        onClick={() => complete(q.quest_id)}
                        loading={acting === q.quest_id}
                        disabled={!allStepsDone}
                        size="sm" variant="primary"
                      >
                        領獎
                      </Button>
                      <Button
                        onClick={() => abandon(q.quest_id)}
                        loading={acting === q.quest_id}
                        size="sm" variant="danger"
                      >
                        放棄
                      </Button>
                    </div>
                  </div>

                  {/* 步驟進度 */}
                  <StepProgress steps={q.steps} stepProgress={q.step_progress} currentStep={q.current_step} />

                  {/* 獎勵預覽 */}
                  {q.rewards?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-800">
                      <span className="text-gray-600 text-xs">完成獎勵：</span>
                      {q.rewards.map((r, i) => (
                        <span key={i} className={`text-xs ${rewardColor(r.reward_type)}`}>{rewardLabel(r)}</span>
                      ))}
                    </div>
                  )}

                  {!allStepsDone && (
                    <p className="text-gray-600 text-xs">完成所有步驟後可領取獎勵</p>
                  )}
                </div>
              </Card>
            );
          })}
          {quests.length === 0 && (
            <div className="text-gray-500 text-center py-10">
              <div className="text-2xl mb-2">📜</div>
              <div>沒有進行中的任務</div>
              <Button onClick={() => setTab("available")} variant="ghost" size="sm" className="mt-2">前往接取</Button>
            </div>
          )}
        </div>
      )}

      {/* 可接取 */}
      {tab === "available" && (
        <div className="space-y-3">
          {avail.map((q) => (
            <Card key={q.id}>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-200 font-semibold">{q.quest_name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${QUEST_TYPE_COLOR[q.quest_type] || "text-gray-400 bg-gray-800 border-gray-700"}`}>
                      {QUEST_TYPE_LABEL[q.quest_type] || q.quest_type}
                    </span>
                    {q.is_repeatable && <span className="text-xs text-gray-600">可重複</span>}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{q.description}</p>

                  {/* 需求 */}
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-600">
                    {q.level_required > 1 && <span>等級 {q.level_required}+</span>}
                    {q.realm_required_name && <span>境界 {q.realm_required_name}+</span>}
                    {q.total_steps > 0 && <span>{q.total_steps} 個步驟</span>}
                  </div>

                  {/* 獎勵 */}
                  {q.rewards?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-gray-600 text-xs">獎勵：</span>
                      {q.rewards.map((r, i) => (
                        <span key={i} className={`text-xs ${rewardColor(r.reward_type)}`}>{rewardLabel(r)}</span>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => accept(q.id)}
                  loading={acting === q.id}
                  disabled={q.player_status === "in_progress"}
                  size="sm"
                  className="shrink-0"
                >
                  {q.player_status === "in_progress" ? "進行中" : "再接取"}
                </Button>
              </div>
            </Card>
          ))}
          {avail.length === 0 && <div className="text-gray-500 text-center py-10">暫無可接取任務</div>}
        </div>
      )}

      {/* 已完成 */}
      {tab === "completed" && (
        <div className="space-y-2">
          {quests.map((q) => {
            const cdMsg = q.is_repeatable ? cooldownRemaining(q.completed_at, q.repeat_cooldown_hours) : null;
            return (
              <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 text-sm">{q.quest_name}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border ${QUEST_TYPE_COLOR[q.quest_type] || "text-gray-600 bg-gray-800 border-gray-700"}`}>
                    {QUEST_TYPE_LABEL[q.quest_type] || q.quest_type}
                  </span>
                  {q.is_repeatable && (
                    <span className="ml-2 text-xs text-gray-600">可重複</span>
                  )}
                  {cdMsg && (
                    <div className="text-xs text-amber-500 mt-0.5">⏳ {cdMsg}</div>
                  )}
                  {q.is_repeatable && !cdMsg && (
                    <div className="text-xs text-green-500 mt-0.5">✦ 冷卻完成，可再接取</div>
                  )}
                </div>
                <span className="text-green-500 text-xs">✦ 已完成</span>
              </div>
            );
          })}
          {quests.length === 0 && <div className="text-gray-500 text-center py-10">尚未完成任何任務</div>}
        </div>
      )}
    </div>
  );
}
