import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useApi } from "../../hooks/useApi";
import { realmApi } from "../../api/realm";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import { formatNumber } from "../../utils/format";

export default function DashboardPage() {
  const { player, refreshPlayer } = useAuth();
  const realm = useApi(realmApi.getPlayer);

  useEffect(() => {
    refreshPlayer();
    realm.execute();
  }, []);

  const r = realm.data?.realm;

  const shortcuts = [
    { to: "/game/realm", label: "境界突破", icon: "⚡", desc: "突破修為境界" },
    { to: "/game/battle", label: "戰鬥挑戰", icon: "⚔", desc: "挑戰妖獸怪物" },
    { to: "/game/quests", label: "宗門任務", icon: "📜", desc: "完成任務獲得獎勵" },
    { to: "/game/shop", label: "仙靈商城", icon: "💎", desc: "購買修仙資源" },
  ];

  return (
    <div className="space-y-5">
      {/* 歡迎 */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-purple-900/20 border border-yellow-800/30 rounded-lg p-5">
        <div className="text-yellow-400 text-xl font-bold">{player?.display_name || player?.username}</div>
        <div className="text-purple-300 text-sm mt-1">{r?.realm_name || "無名"} · {r?.stage_name || "初期"}</div>
        <div className="mt-3 max-w-xs">
          <ProgressBar value={r?.current_exp ?? 0} max={r?.exp_required ?? 1000} color="yellow" label="境界修為" />
        </div>
      </div>

      {/* 屬性概覽 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "靈石", value: formatNumber(player?.spirit_stones ?? 0), color: "text-yellow-400" },
          { label: "HP", value: `${player?.current_hp ?? 0}/${player?.max_hp ?? 100}`, color: "text-red-400" },
          { label: "MP", value: `${player?.current_mp ?? 0}/${player?.max_mp ?? 50}`, color: "text-blue-400" },
          { label: "等級", value: player?.level ?? 1, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-3">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* 快捷入口 */}
      <div>
        <h2 className="text-yellow-500 text-sm font-semibold mb-3 border-l-2 border-yellow-500 pl-2">快速入口</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {shortcuts.map((s) => (
            <Link key={s.to} to={s.to} className="bg-gray-900 border border-yellow-900/30 hover:border-yellow-700/60 rounded-lg p-4 transition-colors group">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-gray-200 text-sm font-semibold group-hover:text-yellow-400">{s.label}</div>
              <div className="text-gray-500 text-xs mt-1">{s.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* 突破歷史 */}
      {r && (
        <Card title="當前境界詳情">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">境界：</span><span className="text-yellow-400">{r.realm_name}</span></div>
            <div><span className="text-gray-500">階段：</span><span className="text-purple-300">{r.stage_name}</span></div>
            <div><span className="text-gray-500">突破次數：</span><span className="text-gray-200">{r.total_breakthroughs ?? 0}</span></div>
            <div><span className="text-gray-500">失敗次數：</span><span className="text-red-400">{r.failed_breakthroughs ?? 0}</span></div>
          </div>
        </Card>
      )}
    </div>
  );
}
