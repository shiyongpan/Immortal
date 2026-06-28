import { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Preload, useContextBridge, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { UNSAFE_NavigationContext, UNSAFE_LocationContext, UNSAFE_RouteContext } from "react-router";
import { AuthContext } from "../contexts/AuthContext";
import { WebSocketContext } from "../contexts/WebSocketContext";
import { BattleContext } from "../contexts/BattleContext";
import HubScene, { HubHUD } from "./HubScene";
import BattleScene3D, { BattleHUD } from "./BattleScene3D";
import RealmScene3D from "./RealmScene3D";
import ShopScene3D, { ShopHUD } from "./ShopScene3D";
import QuestScene3D, { QuestHUD } from "./QuestScene3D";
import InventoryScene3D, { InventoryHUD } from "./InventoryScene3D";
import SkillScene3D, { SkillHUD } from "./SkillScene3D";
import LeaderboardScene3D, { LeaderboardHUD } from "./LeaderboardScene3D";
import Notification from "../components/ui/Notification";

const SCENE_MAP = {
  "/game": HubScene,
  "/game/realm": RealmScene3D,
  "/game/battle": BattleScene3D,
  "/game/inventory": InventoryScene3D,
  "/game/skills": SkillScene3D,
  "/game/shop": ShopScene3D,
  "/game/quests": QuestScene3D,
  "/game/leaderboard": LeaderboardScene3D,
};

const SCENE_HUD_MAP = {
  "/game": HubHUD,
  "/game/battle": BattleHUD,
  "/game/shop": ShopHUD,
  "/game/inventory": InventoryHUD,
  "/game/skills": SkillHUD,
  "/game/quests": QuestHUD,
  "/game/leaderboard": LeaderboardHUD,
};

function SceneHUD() {
  const { pathname } = useLocation();
  const HUD = SCENE_HUD_MAP[pathname];
  if (!HUD) return null;
  return <HUD />;
}

const _fwd   = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move  = new THREE.Vector3();
const _up    = new THREE.Vector3(0, 1, 0);

function CameraController() {
  const { pathname } = useLocation();
  const isBattle = pathname === '/game/battle';
  const { camera } = useThree();
  const orbitRef = useRef();
  const keysRef  = useRef({});

  useEffect(() => {
    if (isBattle) return;
    const MOVE_KEYS = new Set(['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
    const onDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (MOVE_KEYS.has(e.code)) { e.preventDefault(); keysRef.current[e.code] = true; }
    };
    const onUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [isBattle]);

  useFrame((_, delta) => {
    if (isBattle) return;
    const orbit = orbitRef.current;
    if (!orbit) return;
    const k = keysRef.current;
    if (!k.KeyW && !k.KeyS && !k.KeyA && !k.KeyD && !k.ArrowUp && !k.ArrowDown && !k.ArrowLeft && !k.ArrowRight) return;

    const speed = 14 * delta;
    camera.getWorldDirection(_fwd);
    _fwd.y = 0;
    _fwd.normalize();
    _right.crossVectors(_fwd, _up).normalize();

    _move.set(0, 0, 0);
    if (k.KeyW || k.ArrowUp)    _move.addScaledVector(_fwd,    speed);
    if (k.KeyS || k.ArrowDown)  _move.addScaledVector(_fwd,   -speed);
    if (k.KeyA || k.ArrowLeft)  _move.addScaledVector(_right,  -speed);
    if (k.KeyD || k.ArrowRight) _move.addScaledVector(_right,   speed);

    camera.position.add(_move);
    orbit.target.add(_move);
    orbit.update();
  });

  if (isBattle) return null;

  return (
    <OrbitControls
      ref={orbitRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={6}
      maxDistance={70}
      maxPolarAngle={Math.PI * 0.72}
      enablePan={false}
    />
  );
}

function ActiveScene() {
  const { pathname } = useLocation();
  const Scene = SCENE_MAP[pathname] || HubScene;
  return <Scene />;
}

export default function GameWorld() {
  const Bridge = useContextBridge(
    AuthContext, WebSocketContext, BattleContext,
    UNSAFE_NavigationContext, UNSAFE_LocationContext, UNSAFE_RouteContext,
  );

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", background: "#020408" }}>
      <Canvas
        dpr={1.5}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
        onCreated={({ gl }) => { gl.setClearColor("#020408"); }}
      >
        <Bridge>
          <color attach="background" args={["#020408"]} />
          <fog attach="fog" args={["#020408", 80, 220]} />
          <CameraController />
          <Suspense fallback={null}>
            <Stars radius={120} depth={60} count={3000} factor={5} saturation={0.3} fade speed={0.3} />
            <ActiveScene />
            <EffectComposer>
              <Bloom intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.8} mipmapBlur />
            </EffectComposer>
            <Preload all />
          </Suspense>
        </Bridge>
      </Canvas>
      {/* All scene UI is rendered here — outside Canvas, immune to 3D camera transforms */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <SceneHUD />
      </div>
      <Notification />
    </div>
  );
}
