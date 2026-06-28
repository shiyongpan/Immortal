import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Text } from "@react-three/drei";
import { SceneOverlay } from "../components/3d/SceneOverlay";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";
import { realmApi } from "../api/realm";
import { inventoryApi } from "../api/inventory";
import CultivationParticles from "../components/3d/CultivationParticles";
import PlayerChar from "../components/3d/PlayerChar";
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

// ── 3D Meditation Chamber ─────────────────────────────────────────────────────
function CrystalSpire({ breakthrough }) {
  const ref = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.y = t * 0.3;
      const pulse = breakthrough ? 2 + Math.sin(t * 8) * 1.5 : 0.8 + Math.sin(t * 1.2) * 0.3;
      ref.current.children.forEach((c) => {
        if (c.material?.emissiveIntensity !== undefined) c.material.emissiveIntensity = pulse;
      });
    }
    if (glowRef.current) {
      const s = breakthrough ? 1 + Math.sin(t * 6) * 0.5 : 1 + Math.sin(t * 0.8) * 0.1;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[0, 0, -3]}>
      {/* Base platform */}
      <mesh receiveShadow>
        <cylinderGeometry args={[2.5, 3, 0.6, 8]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Crystal spire */}
      <group ref={ref} position={[0, 0.3, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.6, 5, 6]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={1} transparent opacity={0.85} metalness={0.3} roughness={0.1} />
        </mesh>
        <mesh position={[0, -1, 0]}>
          <coneGeometry args={[0.6, 2, 6]} />
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>
        {[30, 90, 150, 210, 270, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={deg} position={[Math.cos(rad) * 1.2, -0.5, Math.sin(rad) * 1.2]} rotation={[0, rad, 0.4]}>
              <coneGeometry args={[0.2, 1.5, 5]} />
              <meshStandardMaterial color="#c4b5fd" emissive="#c4b5fd" emissiveIntensity={1} transparent opacity={0.8} />
            </mesh>
          );
        })}
      </group>

      {/* Glow orb at base */}
      <mesh ref={glowRef} position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function BreakthroughBeam({ show }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current || !show) return;
    const t = clock.getElapsedTime() * 6;
    ref.current.material.opacity = 0.4 + Math.sin(t) * 0.3;
    ref.current.rotation.y = clock.getElapsedTime() * 2;
  });
  if (!show) return null;
  return (
    <mesh ref={ref} position={[0, 10, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 20, 8, 1, true]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={4} transparent opacity={0.6} side={2} />
    </mesh>
  );
}

function MeditationPlatform() {
  return (
    <group>
      {/* Main mountain platform */}
      <mesh receiveShadow position={[0, -1, 0]}>
        <cylinderGeometry args={[12, 8, 3, 10]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Top surface */}
      <mesh receiveShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[12, 12, 0.4, 10]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Glyph rings on ground */}
      {[4, 7, 10].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.77, 0]}>
          <torusGeometry args={[r, 0.05, 6, 64]} />
          <meshStandardMaterial color={i === 0 ? "#fbbf24" : i === 1 ? "#818cf8" : "#34d399"} emissive={i === 0 ? "#fbbf24" : i === 1 ? "#818cf8" : "#34d399"} emissiveIntensity={1} />
        </mesh>
      ))}
      {/* Stone pillars */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <group key={deg} position={[Math.cos(rad) * 9, 0.3, Math.sin(rad) * 9]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.4, 4, 6]} />
              <meshStandardMaterial color="#1a0a00" roughness={0.9} metalness={0.2} />
            </mesh>
            <mesh position={[0, 2.2, 0]}>
              <sphereGeometry args={[0.2, 6, 6]} />
              <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Realm UI ──────────────────────────────────────────────────────────────────
function RealmUI({ r, inventory, btResult, btLoading, onBreakthrough, cultivateMsg }) {
  const navigate = useNavigate();
  const isAtPeak = r && r.stage_order === 4 && !r.is_extreme;
  const canBreakthrough = r && BigInt(r.current_exp ?? 0) >= BigInt(r.exp_required ?? 999999999);
  const expPct = r ? Math.min(100, Math.round((Number(r.current_exp) / Number(r.exp_required)) * 100)) : 0;
  const ratePerMin = r ? (CULTIVATION_RATE[r.realm_name] ?? 0) : 0;

  const tiandiOwned = (inventory?.items || []).find(i => i.item_id === TIANDI_ITEM_ID)?.quantity ?? 0;
  const tiandiRequired = r ? (r.realm_order ?? 1) : 1;
  const hasTiandi = tiandiOwned >= tiandiRequired;
  const pillInfo = r ? BREAKTHROUGH_PILL[r.realm_order] : null;
  const pillOwned = pillInfo ? (inventory?.items || []).find(i => i.item_id === pillInfo.id)?.quantity ?? 0 : 0;
  const hasPill = pillOwned > 0;

  const BT_TYPE_LABEL = {
    major: { label: "大境界突破", color: "text-yellow-300" },
    extreme: { label: "極境突破", color: "text-purple-300" },
    normal: { label: "境界晉升", color: "text-green-300" },
  };
  const btTypeInfo = btResult?.breakthroughType ? BT_TYPE_LABEL[btResult.breakthroughType] : null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Back button */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <button onClick={() => navigate("/game")}
          className="bg-black/60 backdrop-blur-sm border border-gray-700 hover:border-yellow-700 text-gray-300 hover:text-yellow-400 text-xs px-3 py-1.5 rounded-lg transition-colors">
          ← 返回修煉台
        </button>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-purple-300 text-lg font-bold tracking-widest" style={{ textShadow: "0 0 15px #818cf866" }}>
        ⚡ 境界突破
      </div>

      {/* Auto cultivation indicator */}
      {ratePerMin > 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-cyan-400 bg-cyan-900/30 border border-cyan-800/50 rounded-full px-4 py-1.5">
          <span className="animate-pulse">◉</span>
          自動修練中 · {formatNumber(ratePerMin)} 修為/分
          {cultivateMsg && <span className="text-green-400 ml-2">{cultivateMsg}</span>}
        </div>
      )}

      {/* Realm info panel left */}
      {r && (
        <div className="absolute top-24 left-4 bg-black/65 backdrop-blur-sm border border-purple-900/40 rounded-xl p-4 w-56 pointer-events-auto space-y-3">
          <div>
            <div className="text-yellow-400 text-xl font-bold">{r.realm_name}</div>
            <div className="text-purple-300 text-sm">{r.stage_name}</div>
            {r.is_extreme && <span className="text-xs px-2 py-0.5 bg-red-900/50 border border-red-700 rounded text-red-300">極境關卡</span>}
          </div>

          <div>
            <ProgressBar value={Number(r.current_exp)} max={Number(r.exp_required)} color="yellow" label="境界修為" />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5">
              <span>{formatNumber(r.current_exp)}</span>
              <span>{expPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-gray-800/60 rounded p-1.5">
              <div className="text-gray-400 text-xs">突破</div>
              <div className="text-yellow-400 font-bold">{r.total_breakthroughs ?? 0}</div>
            </div>
            <div className="bg-gray-800/60 rounded p-1.5">
              <div className="text-gray-400 text-xs">失敗</div>
              <div className="text-red-400 font-bold">{r.failed_breakthroughs ?? 0}</div>
            </div>
            <div className="bg-gray-800/60 rounded p-1.5">
              <div className="text-gray-400 text-xs">成功率</div>
              <div className="text-purple-400 font-bold">{r.is_extreme ? "50%" : "100%"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Breakthrough buttons panel right */}
      {r && (
        <div className="absolute top-24 right-4 bg-black/65 backdrop-blur-sm border border-yellow-900/40 rounded-xl p-4 w-56 pointer-events-auto space-y-3">
          <div className="text-yellow-400 font-semibold text-sm text-center">突破選項</div>

          {btResult && (
            <div className={`p-2.5 rounded border text-xs ${btResult.success ? "bg-yellow-900/30 border-yellow-700" : "bg-red-900/30 border-red-800"}`}>
              <div className={`font-semibold ${btResult.success ? (btTypeInfo?.color ?? "text-yellow-300") : "text-red-300"}`}>
                {btResult.success ? `✦ ${btTypeInfo?.label ?? "突破成功"}` : "✗ 突破失敗"}
              </div>
              <div className="text-gray-300 text-xs mt-0.5">{btResult.message}</div>
            </div>
          )}

          {isAtPeak ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 bg-gray-800/60 rounded p-2">
                <div className="text-yellow-400 font-semibold mb-1">⚖ 巔峰岔路</div>
                <div>天材地寶：<span className={hasTiandi ? "text-green-400" : "text-red-400"}>{tiandiOwned}/{tiandiRequired}</span></div>
              </div>
              <Button onClick={() => onBreakthrough({ skipExtreme: false })} loading={btLoading} disabled={!canBreakthrough || !hasTiandi} variant={canBreakthrough && hasTiandi ? "primary" : "secondary"} className="w-full">
                {hasTiandi ? "踏入極境" : `天材不足(${tiandiOwned}/${tiandiRequired})`}
              </Button>
              <Button onClick={() => onBreakthrough({ skipExtreme: true })} loading={btLoading} disabled={!canBreakthrough} variant="secondary" className="w-full">
                直入下境界 →
              </Button>
            </div>
          ) : r.is_extreme ? (
            <div className="space-y-2">
              <div className="text-xs text-amber-400/80 bg-amber-900/20 border border-amber-800/50 rounded p-2">
                極境突破有失敗風險（基礎 50%）
              </div>
              <Button onClick={() => onBreakthrough({ useItem: false })} loading={btLoading} disabled={!canBreakthrough} variant={canBreakthrough ? "primary" : "secondary"} className="w-full">
                {canBreakthrough ? "衝擊大境界（50%）" : "修為不足"}
              </Button>
              {hasPill && (
                <Button onClick={() => onBreakthrough({ useItem: true })} loading={btLoading} disabled={!canBreakthrough} variant="purple" className="w-full">
                  {pillInfo?.name}輔助（80%）×{pillOwned}
                </Button>
              )}
            </div>
          ) : (
            <Button onClick={() => onBreakthrough({})} loading={btLoading} disabled={!canBreakthrough} variant={canBreakthrough ? "primary" : "secondary"} className="w-full">
              {canBreakthrough ? "突破境界（100%）" : "修為不足"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────
export default function RealmScene3D() {
  const { refreshPlayer } = useAuth();
  const playerRealm = useApi(realmApi.getPlayer);
  const inventory = useApi(inventoryApi.getAll);
  const [btResult, setBtResult] = useState(null);
  const [btLoading, setBtLoading] = useState(false);
  const [cultivateMsg, setCultivateMsg] = useState(null);
  const [breakthrough, setBreakthrough] = useState(false);

  useEffect(() => {
    playerRealm.execute();
    inventory.execute();
  }, []);

  useEffect(() => {
    const triggerCultivate = async () => {
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
    triggerCultivate();
    const t = setInterval(triggerCultivate, 60_000);
    return () => clearInterval(t);
  }, []);

  const doBreakthrough = async (opts = {}) => {
    setBtLoading(true);
    setBtResult(null);
    try {
      const res = await realmApi.breakthrough(opts);
      setBtResult(res.data);
      if (res.data.success) { setBreakthrough(true); setTimeout(() => setBreakthrough(false), 3000); }
      playerRealm.execute();
      inventory.execute();
      refreshPlayer();
    } catch (err) {
      setBtResult({ success: false, message: err?.response?.data?.error || err.error || "突破失敗" });
    } finally {
      setBtLoading(false);
    }
  };

  const r = playerRealm.data?.realm;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 18]} fov={58} />

      {/* Lighting */}
      <ambientLight intensity={0.2} color="#1a0040" />
      <pointLight position={[0, 20, -3]} intensity={4} color="#818cf8" distance={60} />
      <pointLight position={[-8, 8, 5]} intensity={1.5} color="#fbbf24" distance={40} />
      <pointLight position={[8, 8, 5]} intensity={1.5} color="#c4b5fd" distance={40} />
      {breakthrough && <pointLight position={[0, 10, 0]} intensity={8} color="#ffffff" distance={50} />}

      {/* Meditation platform */}
      <MeditationPlatform />

      {/* Crystal spire */}
      <CrystalSpire breakthrough={breakthrough} />

      {/* Player in meditation */}
      <PlayerChar position={[0, 1, 1.5]} />

      {/* Breakthrough beam */}
      <BreakthroughBeam show={breakthrough} />

      {/* Particles */}
      <CultivationParticles
        count={100}
        radius={14}
        colors={breakthrough
          ? ["#fbbf24", "#ffffff", "#818cf8", "#f0abfc"]
          : ["#818cf8", "#a78bfa", "#c4b5fd", "#fbbf24"]}
      />

      {/* Realm name floating */}
      {r && (
        <Text position={[0, 7, -3]} fontSize={0.5} color="#fbbf24" anchorX="center" outlineWidth={0.05} outlineColor="#000">
          {r.realm_name} · {r.stage_name}
        </Text>
      )}

      {/* HTML UI */}
      <SceneOverlay>
        <RealmUI
          r={r}
          inventory={inventory.data}
          btResult={btResult}
          btLoading={btLoading}
          onBreakthrough={doBreakthrough}
          cultivateMsg={cultivateMsg}
        />
      </SceneOverlay>
    </>
  );
}
