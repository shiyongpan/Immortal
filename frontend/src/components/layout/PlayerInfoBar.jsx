import { useAuth } from "../../contexts/AuthContext";
import { useBattle } from "../../contexts/BattleContext";
import ProgressBar from "../ui/ProgressBar";
import { formatNumber } from "../../utils/format";

export default function PlayerInfoBar() {
  const { player } = useAuth();
  const { battleStats } = useBattle();
  if (!player) return null;

  // 戰鬥中：優先顯示 Canvas 即時 HP/MP
  const hp    = battleStats ? battleStats.hp    : (player.current_hp ?? 100);
  const maxHp = battleStats ? battleStats.maxHp : (player.max_hp ?? 100);
  const mp    = battleStats ? battleStats.mp    : (player.current_mp ?? 50);
  const maxMp = battleStats ? battleStats.maxMp : (player.max_mp ?? 50);

  const realmExpMax = Number(player.realm_exp_required) || 1000;
  const realmExp    = Number(player.realm_exp) || 0;
  const realmPct    = realmExpMax > 0 ? Math.round((realmExp / realmExpMax) * 100) : 0;

  return (
    <aside className="w-52 bg-gray-900 border-l border-yellow-900/30 flex flex-col h-full shrink-0 overflow-y-auto">
      {/* 名稱 & 境界 */}
      <div className="px-4 py-3 border-b border-yellow-900/30">
        <div className="text-yellow-400 font-bold text-sm truncate">{player.display_name || player.username}</div>
        <div className="text-purple-300 text-xs mt-0.5 truncate">{player.realm_name || "凡人"} · {player.stage_name || "初期"}</div>
      </div>

      <div className="p-3 space-y-2.5">
        {/* HP / MP / 修為 */}
        <ProgressBar label="生命" value={hp} max={maxHp} color="red" />
        <ProgressBar label="靈力" value={mp} max={maxMp} color="blue" />

        <div>
          <ProgressBar label="修為" value={realmExp} max={realmExpMax} color="yellow" />
          <div className="text-right text-gray-600 text-xs mt-0.5">{formatNumber(realmExp)} / {formatNumber(realmExpMax)} ({realmPct}%)</div>
        </div>

        {/* 數值 */}
        <div className="border-t border-gray-800 pt-2.5 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">等級</span>
            <span className="text-gray-200">Lv.{player.level ?? 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">靈石</span>
            <span className="text-yellow-400">{formatNumber(player.spirit_stones ?? 0)}</span>
          </div>
          {(player.immortal_jade > 0) && (
            <div className="flex justify-between">
              <span className="text-gray-500">仙玉</span>
              <span className="text-cyan-400">{formatNumber(player.immortal_jade)}</span>
            </div>
          )}
          {(player.honor_points > 0) && (
            <div className="flex justify-between">
              <span className="text-gray-500">榮譽</span>
              <span className="text-purple-400">{formatNumber(player.honor_points)}</span>
            </div>
          )}
          {(player.contribution_points > 0) && (
            <div className="flex justify-between">
              <span className="text-gray-500">貢獻</span>
              <span className="text-green-400">{formatNumber(player.contribution_points)}</span>
            </div>
          )}
        </div>

        {/* 屬性 */}
        <div className="border-t border-gray-800 pt-2.5 space-y-1 text-xs">
          <div className="text-gray-600 text-xs mb-1">屬性</div>
          <div className="flex justify-between">
            <span className="text-gray-500">生命</span>
            <span className="text-red-400">{player.max_hp ?? 100}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">攻擊</span>
            <span className="text-orange-400">{player.attack ?? 10}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">防禦</span>
            <span className="text-blue-400">{player.defense ?? 5}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">速度</span>
            <span className="text-green-400">{player.speed ?? 5}</span>
          </div>
          {player.critical_rate != null && (
            <div className="flex justify-between">
              <span className="text-gray-500">暴擊</span>
              <span className="text-yellow-500">{player.critical_rate}%</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
