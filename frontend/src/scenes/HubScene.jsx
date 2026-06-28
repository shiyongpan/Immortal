import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Cloud } from "@react-three/drei";
import GroundMist from "../components/3d/GroundMist";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWS } from "../contexts/WebSocketContext";
import { useBattle } from "../contexts/BattleContext";
import { useApi } from "../hooks/useApi";
import { realmApi } from "../api/realm";
import { inventoryApi } from "../api/inventory";
import FloatingIsland from "../components/3d/FloatingIsland";
import Pagoda from "../components/3d/Pagoda";
import PlayerChar from "../components/3d/PlayerChar";
import CultivationParticles from "../components/3d/CultivationParticles";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";
import { formatNumber } from "../utils/format";

const CULTIVATION_RATE = { "築基境": 50, "金丹境": 500, "元嬰境": 5000, "化神境": 50000 };
const BREAKTHROUGH_PILL = {
  1: { id: 43, name: "聚靈丹" }, 2: { id: 44, name: "築基丹" },
  3: { id: 45, name: "結金丹" }, 4: { id: 46, name: "破嬰丹" },
  5: { id: 47, name: "化神丹" },
};
const TIANDI_ITEM_ID = 71;

const PORTALS = [
  { to: "/game/battle",      label: "戰鬥挑戰", icon: "⚔",  color: "#ef4444" },
  { to: "/game/inventory",   label: "儲物戒",   icon: "💎", color: "#a78bfa" },
  { to: "/game/skills",      label: "功法修練", icon: "📖", color: "#60a5fa" },
  { to: "/game/shop",        label: "仙靈商城", icon: "🛒", color: "#34d399" },
  { to: "/game/quests",      label: "宗門任務", icon: "📜", color: "#f97316" },
  { to: "/game/leaderboard", label: "排行榜",   icon: "🏆", color: "#e879f9" },
];

function GroundGlyph() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.08;
  });
  return (
    <group ref={ref} position={[0, 2.56, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.5, 0.06, 8, 80]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.2, 0.04, 8, 64]} />
        <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={1.5} />
      </mesh>
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={deg} position={[Math.cos(rad) * 4.3, 0, Math.sin(rad) * 4.3]} rotation={[-Math.PI / 2, 0, rad]}>
            <boxGeometry args={[0.05, 0.01, 2.4]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.2} />
          </mesh>
        );
      })}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={`dot-${deg}`} position={[Math.cos(rad) * 5.5, 0, Math.sin(rad) * 5.5]}>
            <sphereGeometry args={[0.12, 6, 6]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} />
          </mesh>
        );
      })}
    </group>
  );
}

export function HubHUD() {
  const { player, logout, refreshPlayer } = useAuth();
  const { connected, onlineCount } = useWS();
  const { battleStats } = useBattle();
  const navigate = useNavigate();

  const playerRealm = useApi(realmApi.getPlayer);
  const inventory   = useApi(inventoryApi.getAll);
  const [btResult,    setBtResult]    = useState(null);
  const [btLoading,   setBtLoading]   = useState(false);
  const [cultivateMsg, setCultivateMsg] = useState(null);

  useEffect(() => {
    playerRealm.execute();
    inventory.execute();
  }, []);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await realmApi.cultivate();
        if (res.data.gained > 0) {
          setCultivateMsg(`+${formatNumber(res.data.gained)} 修為`);
          setTimeout(() => setCultivateMsg(null), 3000);
          playerRealm.execute();
          refreshPlayer();
        }
      } catch (_) {}
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const doBreakthrough = async (opts = {}) => {
    setBtLoading(true);
    setBtResult(null);
    try {
      const res = await realmApi.breakthrough(opts);
      setBtResult(res.data);
      playerRealm.execute();
      inventory.execute();
      refreshPlayer();
    } catch (err) {
      setBtResult({ success: false, message: err?.response?.data?.error || "突破失敗" });
    } finally {
      setBtLoading(false);
    }
  };

  if (!player) return null;

  const hp    = battleStats ? battleStats.hp    : (player.current_hp ?? 100);
  const maxHp = battleStats ? battleStats.maxHp : (player.max_hp ?? 100);
  const mp    = battleStats ? battleStats.mp    : (player.current_mp ?? 50);
  const maxMp = battleStats ? battleStats.maxMp : (player.max_mp ?? 50);

  const r = playerRealm.data?.realm;
  const expPct      = r ? Math.min(100, Math.round((Number(r.current_exp) / Number(r.exp_required)) * 100)) : 0;
  const ratePerMin  = r ? (CULTIVATION_RATE[r.realm_name] ?? 0) : 0;
  const canBreak    = r && BigInt(r.current_exp ?? 0) >= BigInt(r.exp_required ?? 999999999);
  const isAtPeak    = r && r.stage_order === 4 && !r.is_extreme;
  const tiandiOwned = (inventory.data?.items || []).find(i => i.item_id === TIANDI_ITEM_ID)?.quantity ?? 0;
  const tiandiReq   = r ? (r.realm_order ?? 1) : 1;
  const hasTiandi   = tiandiOwned >= tiandiReq;
  const pillInfo    = r ? BREAKTHROUGH_PILL[r.realm_order] : null;
  const pillOwned   = pillInfo ? (inventory.data?.items || []).find(i => i.item_id === pillInfo.id)?.quantity ?? 0 : 0;
  const hasPill     = pillOwned > 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top center title */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center">
        <div className="text-yellow-400 text-2xl font-bold tracking-[0.3em] drop-shadow-lg" style={{ textShadow: "0 0 20px #fbbf24aa" }}>
          修仙世界
        </div>
        <div className="text-purple-300 text-xs mt-1 tracking-wider">
          {player.display_name || player.username}
          {player.realm_name && ` · ${player.realm_name} ${player.stage_name || ""}`}
        </div>
      </div>

      {/* Online count top right */}
      <div className="absolute top-5 right-5 text-xs text-gray-400 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-gray-600"}`} />
        在線 {onlineCount} 人
      </div>

      {/* Player stats bottom left */}
      <div className="absolute bottom-24 left-5 bg-black/65 backdrop-blur-sm border border-yellow-900/40 rounded-xl p-3.5 text-xs space-y-2 w-44">
        <div className="text-yellow-400 font-bold text-sm">{player.display_name || player.username}</div>
        <div className="text-purple-300 text-xs -mt-1">{player.realm_name || "凡人"} · Lv.{player.level ?? 1}</div>
        <div className="space-y-1.5 pt-1">
          <div>
            <div className="flex justify-between text-gray-500 mb-0.5"><span>生命</span><span className="text-red-400">{hp}/{maxHp}</span></div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${(hp / maxHp) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-gray-500 mb-0.5"><span>靈力</span><span className="text-blue-400">{mp}/{maxMp}</span></div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(mp / maxMp) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="pt-1 border-t border-gray-800 space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">靈石</span><span className="text-yellow-400">{formatNumber(player.spirit_stones ?? 0)}</span></div>
          {player.immortal_jade > 0 && (
            <div className="flex justify-between"><span className="text-gray-500">仙玉</span><span className="text-cyan-400">{formatNumber(player.immortal_jade)}</span></div>
          )}
        </div>
      </div>

      {/* Realm breakthrough panel bottom right */}
      {r && (
        <div className="absolute bottom-24 right-5 bg-black/65 backdrop-blur-sm border border-purple-900/40 rounded-xl p-3.5 text-xs w-52 pointer-events-auto space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-yellow-400 font-bold">{r.realm_name}</span>
              <span className="text-purple-300 ml-1.5">{r.stage_name}</span>
            </div>
            {r.is_extreme && <span className="text-red-300 text-[9px] border border-red-700/60 rounded px-1.5 py-0.5">極境</span>}
          </div>

          {/* EXP bar */}
          <div>
            <ProgressBar value={Number(r.current_exp)} max={Number(r.exp_required)} color="yellow" label="境界修為" />
            <div className="flex justify-between text-gray-500 mt-0.5">
              <span>{formatNumber(r.current_exp)}</span>
              <span>{expPct}%</span>
            </div>
          </div>

          {/* Auto cultivation */}
          {ratePerMin > 0 && (
            <div className="flex items-center gap-1.5 text-cyan-400 text-[10px]">
              <span className="animate-pulse">◉</span>
              自動修練 {formatNumber(ratePerMin)}/分
              {cultivateMsg && <span className="text-green-400 ml-1">{cultivateMsg}</span>}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-gray-800/60 rounded p-1">
              <div className="text-gray-500 text-[9px]">突破次數</div>
              <div className="text-yellow-400 font-bold">{r.total_breakthroughs ?? 0}</div>
            </div>
            <div className="bg-gray-800/60 rounded p-1">
              <div className="text-gray-500 text-[9px]">失敗</div>
              <div className="text-red-400 font-bold">{r.failed_breakthroughs ?? 0}</div>
            </div>
            <div className="bg-gray-800/60 rounded p-1">
              <div className="text-gray-500 text-[9px]">成功率</div>
              <div className="text-purple-400 font-bold">{r.is_extreme ? "50%" : "100%"}</div>
            </div>
          </div>

          {/* Breakthrough buttons */}
          {isAtPeak ? (
            <div className="space-y-1.5">
              <div className="text-yellow-400/80 text-[10px] text-center">
                ⚖ 天材地寶 <span className={hasTiandi ? "text-green-400" : "text-red-400"}>{tiandiOwned}/{tiandiReq}</span>
              </div>
              <Button onClick={() => doBreakthrough({ skipExtreme: false })} loading={btLoading}
                disabled={!canBreak || !hasTiandi}
                variant={canBreak && hasTiandi ? "primary" : "secondary"} className="w-full">
                {hasTiandi ? "踏入極境" : `天材不足`}
              </Button>
              <Button onClick={() => doBreakthrough({ skipExtreme: true })} loading={btLoading}
                disabled={!canBreak} variant="secondary" className="w-full">
                直入下境界 →
              </Button>
            </div>
          ) : r.is_extreme ? (
            <div className="space-y-1.5">
              <div className="text-amber-400/70 text-[10px] text-center">極境突破有失敗風險（基礎 50%）</div>
              <Button onClick={() => doBreakthrough({ useItem: false })} loading={btLoading}
                disabled={!canBreak} variant={canBreak ? "primary" : "secondary"} className="w-full">
                {canBreak ? "衝擊大境界（50%）" : "修為不足"}
              </Button>
              {hasPill && (
                <Button onClick={() => doBreakthrough({ useItem: true })} loading={btLoading}
                  disabled={!canBreak} variant="purple" className="w-full">
                  {pillInfo?.name}輔助（80%）×{pillOwned}
                </Button>
              )}
            </div>
          ) : (
            <Button onClick={() => doBreakthrough({})} loading={btLoading}
              disabled={!canBreak} variant={canBreak ? "primary" : "secondary"} className="w-full">
              {canBreak ? "⚡ 突破境界" : "修為不足"}
            </Button>
          )}

          {/* Result message */}
          {btResult && (
            <div className={`p-2 rounded text-[10px] border ${btResult.success ? "bg-yellow-900/30 border-yellow-700/60 text-yellow-300" : "bg-red-900/30 border-red-800/60 text-red-300"}`}>
              {btResult.success ? "✦ " : "✗ "}{btResult.message}
            </div>
          )}
        </div>
      )}

      {/* Bottom navigation bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
        {PORTALS.map(p => (
          <button
            key={p.to}
            onClick={() => navigate(p.to)}
            className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-black/65 backdrop-blur-sm border transition-all duration-200 hover:scale-110 hover:bg-black/85"
            style={{ borderColor: p.color + "44" }}
          >
            <span className="text-2xl leading-none">{p.icon}</span>
            <span className="text-[10px] tracking-wider" style={{ color: p.color }}>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="absolute top-5 left-5 pointer-events-auto">
        <button onClick={logout} className="text-xs text-gray-600 hover:text-red-400 transition-colors bg-black/40 px-2 py-1 rounded">
          登出
        </button>
      </div>
    </div>
  );
}

export default function HubScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 12, 22]} fov={58} />

      {/* Lighting */}
      <ambientLight intensity={1.4} color="#e8d8ff" />
      <hemisphereLight args={["#b8d8ff", "#6b8c3a", 2.0]} />
      <directionalLight position={[18, 35, 12]} intensity={2.8} color="#fff5d8" castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1} shadow-camera-far={120}
        shadow-camera-left={-20} shadow-camera-right={20}
        shadow-camera-top={20} shadow-camera-bottom={-20}
      />
      <pointLight position={[0, 25, 0]} intensity={4} color="#fbbf24" distance={100} />
      <pointLight position={[-12, 8, -8]} intensity={2} color="#818cf8" distance={60} />
      <pointLight position={[12, 8, -8]} intensity={2} color="#f0abfc" distance={60} />
      <pointLight position={[0, 6, 10]} intensity={1.5} color="#34d399" distance={50} />

      {/* Atmospheric clouds */}
      <Cloud position={[-20, 14, -25]} opacity={0.18} speed={0.08} segments={6} />
      <Cloud position={[22, 12, -18]} opacity={0.14} speed={0.07} segments={5} />
      <Cloud position={[0, 18, -30]} opacity={0.22} speed={0.1} segments={8} />
      <Cloud position={[-15, 8, 15]} opacity={0.12} speed={0.06} segments={4} />

      {/* 地面霧氣 - 自動飄動與重生 */}
      <GroundMist count={16} islandRadius={7.8} />

      {/* Floating island */}
      <FloatingIsland position={[0, 0, 0]} />

      {/* Pagoda */}
      <Pagoda position={[0, 2.5, -3]} />

      {/* Player character on island */}
      <PlayerChar position={[0, 2.5, 1.5]} />

      {/* Ground magic circle */}
      <GroundGlyph />

      {/* Cultivation energy particles */}
      <CultivationParticles count={80} radius={16} />

    </>
  );
}
