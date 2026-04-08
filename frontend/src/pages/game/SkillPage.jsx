import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { skillApi } from "../../api/skill";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function SkillPage() {
  const available = useApi(skillApi.getAvailable);
  const playerSkills = useApi(skillApi.getPlayer);
  const [tab, setTab] = useState("learned");
  const [msg, setMsg] = useState("");

  useEffect(() => { available.execute(); playerSkills.execute(); }, []);

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };

  const learn = async (skillId) => {
    try { const r = await skillApi.learn(skillId); notify(r.data.message || "學習成功"); playerSkills.execute(); available.execute(); }
    catch (err) { notify(err.error || "學習失敗"); }
  };

  const upgrade = async (playerSkillId) => {
    try { const r = await skillApi.upgrade(playerSkillId); notify(r.data.message || "升級成功"); playerSkills.execute(); }
    catch (err) { notify(err.error || "升級失敗"); }
  };

  const learned = playerSkills.data?.skills || [];
  const avail = available.data?.skills || [];

  return (
    <div className="space-y-4">
      <h1 className="text-yellow-400 text-xl font-bold border-l-2 border-yellow-500 pl-3">功法修練</h1>

      {msg && <div className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200">{msg}</div>}

      <div className="flex gap-2">
        <Button onClick={() => setTab("learned")} variant={tab === "learned" ? "primary" : "secondary"} size="sm">已學功法 ({learned.length})</Button>
        <Button onClick={() => setTab("available")} variant={tab === "available" ? "primary" : "secondary"} size="sm">可學功法 ({avail.length})</Button>
      </div>

      {tab === "learned" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {learned.map((s) => (
            <Card key={s.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-purple-300 font-semibold">{s.skill_name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.skill_type} · Lv.{s.current_level}/{s.max_level}</div>
                  <div className="text-gray-400 text-xs mt-1">{s.description}</div>
                  <div className="text-blue-400 text-xs mt-1">靈力消耗：{s.mp_cost}</div>
                </div>
                <Button onClick={() => upgrade(s.id)} size="sm" variant="purple" disabled={s.current_level >= s.max_level}>
                  {s.current_level >= s.max_level ? "已滿級" : "升級"}
                </Button>
              </div>
            </Card>
          ))}
          {learned.length === 0 && <div className="text-gray-500 text-center py-8 col-span-2">尚未學習任何功法</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {avail.map((s) => (
            <Card key={s.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-gray-200 font-semibold">{s.skill_name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.skill_type}</div>
                  <div className="text-gray-400 text-xs mt-1">{s.description}</div>
                  <div className="text-yellow-500 text-xs mt-1">需要 {s.learn_cost_stones} 靈石</div>
                </div>
                <Button onClick={() => learn(s.id)} size="sm">學習</Button>
              </div>
            </Card>
          ))}
          {avail.length === 0 && <div className="text-gray-500 text-center py-8 col-span-2">無可學習的功法</div>}
        </div>
      )}
    </div>
  );
}
