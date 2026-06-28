import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Text } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";
import { battleApi } from "../api/battle";
import MonsterChar from "../components/3d/MonsterChar";
import PlayerChar from "../components/3d/PlayerChar";
import Button from "../components/ui/Button";

// ── Module signals ─────────────────────────────────────────────────────────────
let _setAttackSide = null;
const battleAnimSignal = {
  register: (fn) => { _setAttackSide = fn; },
  trigger: (side) => { _setAttackSide?.(side); },
};

let _onMonsterHit = null;
const battleHitSignal = {
  register: (fn) => { _onMonsterHit = fn; },
  trigger: (monsterId) => { _onMonsterHit?.(monsterId); },
};

// ── World constants ────────────────────────────────────────────────────────────
// Player can explore within ±WORLD_BOUNDS units from center
const WORLD_BOUNDS = 65;
const PROJ_COUNT = 8;
const PROJ_SPEED = 16;
const PROJ_LIFE = 3.2;
const HIT_RADIUS = 1.4;
const CAM_HEIGHT = 20;
const PLAYER_SPEED = 7;

// Monsters placed across different world zones [x, y, z]
const MONSTER_SLOTS = [
  [9, 0.5, 8],    // near spawn east
  [-9, 0.5, 8],   // near spawn west
  [-7, 0.5, -22], // forest
  [6, 0.5, -18],  // forest edge
  [0, 0.5, -32],  // deep forest
  [-26, 0.5, 2],  // ruins
  [-22, 0.5, -12],// ruins inner
  [30, 0.5, 5],   // mountains
  [10, 0.5, 30],  // south plain
  [-10, 0.5, 30], // south plain
];

// World decoration positions [x, z]
const TREES = [
  [-5, -20], [-10, -24], [-3, -28], [3, -22], [-8, -30],
  [6, -32], [-15, -26], [8, -26], [-12, -20], [2, -18],
  [12, -24], [-6, -34], [1, -30], [15, -28], [-2, -38],
  [9, -22], [-4, -16], [13, -18], [35, -12], [-35, 18],
  [28, 32], [-30, -30], [22, 42], [-25, -38], [5, -42],
];
const BOULDERS = [
  [28, -8], [32, 5], [35, 12], [30, 20], [38, -2], [42, 8],
  [-5, 42], [10, -44], [-32, 25], [0, -52], [-22, 36], [48, -10],
  [25, -18], [44, 20], [36, -20],
];
const PILLARS = [
  [-22, 5], [-28, -2], [-25, 12], [-32, 8],
  [-20, -8], [-35, 2], [-18, 18], [-30, -15],
];
const CRYSTALS = [
  [-15, -14], [-20, -10], [-18, -20], [-12, -17], [-22, -16],
];

// ── Reusables ──────────────────────────────────────────────────────────────────
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _v3 = new THREE.Vector3();
const _v2 = new THREE.Vector2();

// ── Decoration components ──────────────────────────────────────────────────────
function Tree({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 3.6, 6]} />
        <meshStandardMaterial color="#6b3a10" roughness={0.88} />
      </mesh>
      <mesh position={[0, 4, 0]} castShadow>
        <coneGeometry args={[1.4, 2.8, 7]} />
        <meshStandardMaterial color="#2d6630" roughness={0.82} />
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[0.9, 2.2, 7]} />
        <meshStandardMaterial color="#356640" roughness={0.82} />
      </mesh>
    </group>
  );
}

function Boulder({ x, z, idx }) {
  const scale = 0.7 + (idx % 3) * 0.45;
  return (
    <mesh position={[x, scale * 0.45, z]} scale={scale} castShadow>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#606070" roughness={0.88} metalness={0.12} />
    </mesh>
  );
}

function AncientPillar({ x, z, idx }) {
  const broken = idx % 3 !== 0;
  const height = broken ? 1.5 + (idx % 3) * 0.7 : 5;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.38, height, 8]} />
        <meshStandardMaterial color="#484860" roughness={0.85} metalness={0.18} />
      </mesh>
      {!broken && (
        <mesh position={[0, height / 2 + 0.12, 0]}>
          <sphereGeometry args={[0.22, 8, 6]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  );
}

function GlowingCrystal({ x, z }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.material.emissiveIntensity = 1.5 + Math.sin(t * 2) * 0.5;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh ref={meshRef} position={[0, 1.2, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.5} transparent opacity={0.88} metalness={0.3} roughness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// ── Open World terrain ─────────────────────────────────────────────────────────
function OpenWorld() {
  return (
    <group>
      {/* Base ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#3d4a30" roughness={0.88} />
      </mesh>

      {/* Zone ground patches */}
      {/* Forest (north, -Z) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -28]}>
        <planeGeometry args={[55, 44]} />
        <meshStandardMaterial color="#1e3d1e" roughness={0.9} transparent opacity={0.95} />
      </mesh>
      {/* Ruins (west, -X) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-27, 0.005, 3]}>
        <planeGeometry args={[30, 38]} />
        <meshStandardMaterial color="#3a3650" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      {/* Mountains (east, +X) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[33, 0.005, 5]}>
        <planeGeometry args={[30, 40]} />
        <meshStandardMaterial color="#3a3030" roughness={0.9} transparent opacity={0.85} />
      </mesh>
      {/* Cultivation ground (north-west) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-17, 0.005, -16]}>
        <planeGeometry args={[18, 16]} />
        <meshStandardMaterial color="#1e4030" roughness={0.9} transparent opacity={0.95} />
      </mesh>

      {/* Stone paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <planeGeometry args={[2.5, 100]} />
        <meshStandardMaterial color="#2a2a40" roughness={0.88} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 5]}>
        <planeGeometry args={[100, 2.5]} />
        <meshStandardMaterial color="#2a2a40" roughness={0.88} transparent opacity={0.85} />
      </mesh>

      {/* Central plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[10, 32]} />
        <meshStandardMaterial color="#252545" roughness={0.82} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <torusGeometry args={[10, 0.12, 6, 48]} />
        <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={1.2} />
      </mesh>

      {/* Spawn marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -3]}>
        <circleGeometry args={[1.0, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.0} transparent opacity={0.5} />
      </mesh>

      {/* Trees */}
      {TREES.map(([x, z], i) => <Tree key={i} x={x} z={z} />)}

      {/* Boulders */}
      {BOULDERS.map(([x, z], i) => <Boulder key={i} x={x} z={z} idx={i} />)}

      {/* Ancient pillars */}
      {PILLARS.map(([x, z], i) => <AncientPillar key={i} x={x} z={z} idx={i} />)}

      {/* Glowing crystals */}
      {CRYSTALS.map(([x, z], i) => <GlowingCrystal key={i} x={x} z={z} />)}

      {/* World boundary walls (dark mountains at edges) */}
      <mesh position={[0, 6, -75]}>
        <boxGeometry args={[160, 14, 6]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 6, 75]}>
        <boxGeometry args={[160, 14, 6]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
      </mesh>
      <mesh position={[-75, 6, 0]}>
        <boxGeometry args={[6, 14, 160]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
      </mesh>
      <mesh position={[75, 6, 0]}>
        <boxGeometry args={[6, 14, 160]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.95} />
      </mesh>

      {/* Zone labels (ground-level, face up for top-down view) */}
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, -38]} fontSize={2.8} color="#86a870" anchorX="center" outlineWidth={0.12} outlineColor="#000">
        妖魔森林
      </Text>
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[-30, 0.3, 5]} fontSize={2.6} color="#8888cc" anchorX="center" outlineWidth={0.12} outlineColor="#000">
        荒廢遺跡
      </Text>
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[34, 0.3, 5]} fontSize={2.6} color="#cc8888" anchorX="center" outlineWidth={0.12} outlineColor="#000">
        靈岩山脈
      </Text>
      <Text rotation={[-Math.PI / 2, 0, 0]} position={[-17, 0.3, -16]} fontSize={2.2} color="#60d890" anchorX="center" outlineWidth={0.1} outlineColor="#000">
        修煉靈地
      </Text>
    </group>
  );
}

// ── Battle HUD (DOM layer, outside Canvas) ─────────────────────────────────────
export function BattleHUD() {
  const navigate = useNavigate();
  const { player, refreshPlayer } = useAuth();
  const { execute: refreshLogs, data: logsData } = useApi(battleApi.getLogs);
  const [battleResult, setBattleResult] = useState(null);
  const [fighting, setFighting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fightingRef = useRef(false);

  useEffect(() => { refreshLogs(); }, [refreshLogs]);

  const fight = useCallback(async (monsterId) => {
    if (fightingRef.current) return;
    fightingRef.current = true;
    setFighting(true);
    setBattleResult(null);
    battleAnimSignal.trigger("player");
    setTimeout(() => battleAnimSignal.trigger(null), 500);
    try {
      const res = await battleApi.start(monsterId);
      setBattleResult(res.data);
      refreshLogs();
      refreshPlayer();
    } catch (err) {
      setBattleResult({ result: "error", message: err.error || "戰鬥失敗" });
    } finally {
      fightingRef.current = false;
      setFighting(false);
    }
  }, [refreshPlayer, refreshLogs]);

  useEffect(() => {
    battleHitSignal.register(fight);
    return () => battleHitSignal.register(null);
  }, [fight]);

  const restoreHp = async () => {
    setRestoring(true);
    try { await battleApi.restoreHp(); refreshPlayer(); }
    catch (err) { alert(err.error || "回復失敗"); }
    finally { setRestoring(false); }
  };

  const RESULT_COLOR = { win: "text-yellow-300", lose: "text-red-400", error: "text-red-400" };

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Back */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <button onClick={() => navigate("/game")}
          className="bg-black/60 backdrop-blur-sm border border-gray-700 hover:border-yellow-700 text-gray-300 hover:text-yellow-400 text-xs px-3 py-1.5 rounded-lg transition-colors">
          ← 返回修煉台
        </button>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-purple-400 text-lg font-bold tracking-widest" style={{ textShadow: "0 0 15px #818cf866" }}>
        靈域探索
      </div>

      {/* Controls hint */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 text-gray-600 text-xs tracking-widest">
        WASD 移動 · 左鍵 攻擊
      </div>

      {/* Player status */}
      {player && (
        <div className="absolute top-20 left-4 bg-black/60 backdrop-blur-sm border border-gray-800 rounded-lg px-3 py-2 text-xs w-48">
          <div className="text-gray-300 font-semibold mb-1.5">{player.display_name || player.username}</div>
          <div className="mb-1">
            <div className="flex justify-between text-gray-500 mb-0.5">
              <span>HP</span><span className="text-red-400">{player.current_hp}/{player.max_hp}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${(player.current_hp / player.max_hp) * 100}%` }} />
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-gray-500 mb-0.5">
              <span>MP</span><span className="text-blue-400">{player.current_mp}/{player.max_mp}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(player.current_mp / player.max_mp) * 100}%` }} />
            </div>
          </div>
          <div className="pointer-events-auto">
            <Button onClick={restoreHp} loading={restoring} variant="secondary" size="sm" className="w-full text-xs">
              回復 HP
            </Button>
          </div>
        </div>
      )}

      {/* Battle result */}
      {battleResult && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 backdrop-blur-sm border border-gray-700 rounded-xl p-5 text-center min-w-48 pointer-events-auto">
          <div className={`text-lg font-bold mb-2 ${RESULT_COLOR[battleResult.result] || "text-gray-300"}`}>
            {battleResult.message}
          </div>
          {battleResult.result === "win" && (
            <div className="text-xs space-y-1 text-gray-400 mb-3">
              <div className="text-yellow-400">+{battleResult.expGained} 修為</div>
              <div className="text-yellow-600">+{battleResult.spiritStonesGained} 靈石</div>
            </div>
          )}
          <button onClick={() => setBattleResult(null)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            繼續探索
          </button>
        </div>
      )}

      {/* Battle logs */}
      {logsData?.logs?.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm border border-gray-800 rounded-lg p-3 max-h-28 overflow-y-auto">
          <div className="text-gray-500 text-xs mb-1">近期戰績</div>
          <div className="space-y-0.5">
            {logsData.logs.slice(0, 5).map((l) => (
              <div key={l.id} className="flex gap-3 text-xs">
                <span className={l.result === "win" ? "text-yellow-400" : "text-red-400"}>
                  {l.result === "win" ? "✦ 勝" : "✗ 敗"}
                </span>
                <span className="text-gray-300">{l.monster_name}</span>
                <span className="text-yellow-700">+{l.exp_gained}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fighting && (
        <div className="absolute bottom-20 right-4 text-yellow-500 text-xs animate-pulse bg-black/50 px-2 py-1 rounded">
          戰鬥中...
        </div>
      )}
    </div>
  );
}

// ── Scene (3D, inside Canvas) ──────────────────────────────────────────────────
export default function BattleScene3D() {
  const { player } = useAuth();
  const { execute: fetchMonsters, data: monstersData } = useApi(battleApi.getMonsters);
  const [attackSide, setAttackSide] = useState(null);

  const playerGroupRef = useRef();
  const playerPosRef = useRef(new THREE.Vector3(0, 0, -3));
  const keysRef = useRef({});
  const playerLightRef = useRef();

  const mouseWorldRef = useRef(new THREE.Vector3());
  const aimDotRef = useRef();

  const projMeshRefs = useRef(new Array(PROJ_COUNT).fill(null));
  const projDataRef = useRef([]);

  const monstersRef = useRef([]);
  useEffect(() => {
    if (monstersData?.monsters) {
      monstersRef.current = monstersData.monsters.slice(0, MONSTER_SLOTS.length);
    }
  }, [monstersData]);

  useEffect(() => { fetchMonsters(); }, [fetchMonsters]);
  useEffect(() => {
    battleAnimSignal.register(setAttackSide);
    return () => battleAnimSignal.register(null);
  }, []);

  useEffect(() => {
    const KEYS = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD']);
    const onDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (KEYS.has(e.code)) { e.preventDefault(); keysRef.current[e.code] = true; }
    };
    const onUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  const fireProjectile = useCallback((clickPoint) => {
    const pp = playerPosRef.current;
    _v3.set(clickPoint.x - pp.x, 0, clickPoint.z - pp.z);
    if (_v3.lengthSq() < 0.01) return;
    _v3.normalize();
    if (projDataRef.current.length >= PROJ_COUNT) return;
    projDataRef.current.push({
      pos: new THREE.Vector3(pp.x, 0.8, pp.z),
      dir: _v3.clone(),
      life: PROJ_LIFE,
    });
  }, []);

  useFrame(({ camera, raycaster, pointer }, delta) => {
    // Cursor world position
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(_groundPlane, mouseWorldRef.current);
    if (aimDotRef.current) {
      aimDotRef.current.position.x = mouseWorldRef.current.x;
      aimDotRef.current.position.z = mouseWorldRef.current.z;
    }

    // WASD movement — W=-Z, S=+Z, A=-X, D=+X
    const k = keysRef.current;
    const speed = PLAYER_SPEED * delta;
    if (k.KeyW || k.KeyS || k.KeyA || k.KeyD) {
      let nx = playerPosRef.current.x;
      let nz = playerPosRef.current.z;
      if (k.KeyW) nz -= speed;
      if (k.KeyS) nz += speed;
      if (k.KeyA) nx -= speed;
      if (k.KeyD) nx += speed;
      // Clamp to world bounds (rectangle)
      nx = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, nx));
      nz = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, nz));
      playerPosRef.current.x = nx;
      playerPosRef.current.z = nz;
    }

    // Update player mesh
    if (playerGroupRef.current) {
      playerGroupRef.current.position.x = playerPosRef.current.x;
      playerGroupRef.current.position.z = playerPosRef.current.z;
      _v3.set(
        mouseWorldRef.current.x - playerPosRef.current.x,
        0,
        mouseWorldRef.current.z - playerPosRef.current.z,
      );
      if (_v3.lengthSq() > 0.01) {
        playerGroupRef.current.rotation.y = Math.atan2(_v3.x, _v3.z);
      }
    }

    // Top-down camera follows player
    camera.position.set(playerPosRef.current.x, CAM_HEIGHT, playerPosRef.current.z + 2);
    camera.lookAt(playerPosRef.current.x, 0, playerPosRef.current.z);

    // Player lantern light follows character
    if (playerLightRef.current) {
      playerLightRef.current.position.set(playerPosRef.current.x, 7, playerPosRef.current.z);
    }

    // Projectile pool update
    for (let i = 0; i < PROJ_COUNT; i++) {
      if (projMeshRefs.current[i]) projMeshRefs.current[i].position.y = -100;
    }

    const alive = [];
    for (let i = 0; i < projDataRef.current.length; i++) {
      const p = projDataRef.current[i];
      p.life -= delta;
      p.pos.x += p.dir.x * PROJ_SPEED * delta;
      p.pos.z += p.dir.z * PROJ_SPEED * delta;

      if (p.life <= 0) continue;

      let hit = false;
      for (let j = 0; j < monstersRef.current.length; j++) {
        const slot = MONSTER_SLOTS[j];
        const dx = p.pos.x - slot[0];
        const dz = p.pos.z - slot[2];
        if (dx * dx + dz * dz < HIT_RADIUS * HIT_RADIUS) {
          battleHitSignal.trigger(monstersRef.current[j].id);
          hit = true;
          break;
        }
      }

      if (!hit) alive.push(p);
    }

    projDataRef.current = alive;
    for (let i = 0; i < alive.length && i < PROJ_COUNT; i++) {
      if (projMeshRefs.current[i]) projMeshRefs.current[i].position.copy(alive[i].pos);
    }
  });

  const monsters = monstersData?.monsters?.slice(0, MONSTER_SLOTS.length) || [];

  return (
    <>
      <fog attach="fog" args={["#1a1a2e", 55, 110]} />

      <PerspectiveCamera makeDefault position={[0, CAM_HEIGHT, 2]} fov={48} />

      {/* World lighting — modelled after HubScene brightness */}
      <ambientLight intensity={1.4} color="#d8d0ff" />
      <hemisphereLight args={["#c8c0ff", "#3a5a2a", 2.2]} />
      <directionalLight position={[60, 90, -40]} intensity={2.5} color="#fff5d8" />
      <directionalLight position={[-20, 40, 60]} intensity={1.0} color="#c0d8ff" />
      {/* Player lantern */}
      <pointLight ref={playerLightRef} position={[0, 7, -3]} intensity={6} color="#ffd580" distance={40} decay={1.5} />
      {/* Zone accent lights */}
      <pointLight position={[0, 12, 0]} intensity={4} color="#fbbf24" distance={80} decay={1.5} />
      <pointLight position={[-30, 10, 0]} intensity={3.5} color="#818cf8" distance={80} decay={1.5} />
      <pointLight position={[32, 10, 5]} intensity={3.5} color="#ef4444" distance={80} decay={1.5} />
      <pointLight position={[0, 8, -30]} intensity={3} color="#22c55e" distance={80} decay={1.5} />

      <OpenWorld />

      {/* Invisible click plane — captures left-click to fire */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onClick={(e) => { e.stopPropagation(); fireProjectile(e.point); }}
      >
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Cursor aim dot */}
      <mesh ref={aimDotRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.18, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={4} transparent opacity={0.75} />
      </mesh>

      {/* Player — initial position matches playerPosRef; useFrame updates each frame */}
      <group ref={playerGroupRef} position={[0, 0.5, -3]}>
        <PlayerChar position={[0, 0, 0]} />
        <Text position={[0, 2.5, 0]} fontSize={0.28} color="#86efac" anchorX="center" outlineWidth={0.04} outlineColor="#000">
          {player?.display_name || player?.username || "修仙者"}
        </Text>
      </group>

      {/* Monsters distributed across the world */}
      {monsters.map((m, i) => (
        <group key={m.id} position={MONSTER_SLOTS[i]}>
          <MonsterChar monster={m} position={[0, 0, 0]} attacking={attackSide === "monster"} />
          <Text position={[0, 2.8, 0]} fontSize={0.28} color="#fca5a5" anchorX="center" outlineWidth={0.04} outlineColor="#000">
            {m.monster_name}
          </Text>
        </group>
      ))}

      {/* Projectile pool */}
      {Array.from({ length: PROJ_COUNT }).map((_, i) => (
        <mesh key={i} ref={(el) => { projMeshRefs.current[i] = el; }} position={[0, -100, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={6} transparent opacity={0.95} />
        </mesh>
      ))}
    </>
  );
}
