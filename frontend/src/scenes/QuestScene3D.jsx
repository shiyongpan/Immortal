import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import QuestPage from "../pages/game/QuestPage";
import CultivationParticles from "../components/3d/CultivationParticles";

function QuestHall() {
  const scrollRef = useRef();
  useFrame(({ clock }) => {
    if (scrollRef.current) scrollRef.current.rotation.y = clock.getElapsedTime() * 0.05;
  });

  return (
    <group>
      {/* Grand hall floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#080808" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <torusGeometry args={[6, 0.06, 6, 60]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.5} />
      </mesh>

      {/* Altar / NPC elder platform */}
      <group position={[0, 0, -7]}>
        <mesh castShadow>
          <boxGeometry args={[4, 1, 3]} />
          <meshStandardMaterial color="#1a0a00" roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Elder figure */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.8, 6, 8]} />
          <meshStandardMaterial color="#d4b896" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.45, 0]} castShadow>
          <sphereGeometry args={[0.28, 10, 10]} />
          <meshStandardMaterial color="#c8a87a" roughness={0.5} />
        </mesh>
        {/* Elder robe */}
        <mesh position={[0, 1.3, 0]}>
          <capsuleGeometry args={[0.38, 0.6, 4, 8]} />
          <meshStandardMaterial color="#7c2c00" roughness={0.7} transparent opacity={0.9} />
        </mesh>
        {/* Staff */}
        <mesh position={[0.5, 1.8, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 2.5, 6]} />
          <meshStandardMaterial color="#8b4513" roughness={0.9} />
        </mesh>
        <mesh position={[0.55, 3.1, 0]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={3} />
        </mesh>
      </group>

      {/* Scroll pillars */}
      {[[-6, 0, -3], [6, 0, -3], [-8, 0, 3], [8, 0, 3]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.5, 8, 7]} />
            <meshStandardMaterial color="#1a0800" roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Scroll hanging */}
          <mesh position={[0, 2, 0.5]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.8, 2, 0.05]} />
            <meshStandardMaterial color="#f5e6c8" roughness={0.8} />
          </mesh>
          <mesh position={[0, 4.3, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}

      {/* Rotating quest scroll display */}
      <group ref={scrollRef} position={[0, 4, -4]}>
        {[0, 120, 240].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={deg} position={[Math.cos(rad) * 1.5, 0, Math.sin(rad) * 1.5]}>
              <boxGeometry args={[0.6, 1.5, 0.05]} />
              <meshStandardMaterial color="#f5e6c8" emissive="#f97316" emissiveIntensity={0.2} roughness={0.8} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function BackNav() {
  const navigate = useNavigate();
  return (
    <div className="absolute top-4 left-4 pointer-events-auto z-10">
      <button onClick={() => navigate("/game")}
        className="bg-black/60 backdrop-blur-sm border border-gray-700 hover:border-yellow-700 text-gray-300 hover:text-yellow-400 text-xs px-3 py-1.5 rounded-lg transition-colors">
        ← 返回修煉台
      </button>
    </div>
  );
}

export function QuestHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <BackNav />
      <div className="absolute top-0 right-0 w-[52%] h-full bg-black/70 backdrop-blur-sm border-l border-orange-900/30 overflow-y-auto pointer-events-auto">
        <div className="p-4">
          <QuestPage />
        </div>
      </div>
    </div>
  );
}

export default function QuestScene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[14, 7, 12]} fov={60} />

      <ambientLight intensity={0.2} color="#1a0800" />
      <pointLight position={[0, 12, -5]} intensity={3} color="#f97316" distance={60} />
      <pointLight position={[-6, 6, 2]} intensity={1.5} color="#fbbf24" distance={40} />
      <pointLight position={[6, 6, 2]} intensity={1.5} color="#f97316" distance={40} />

      <QuestHall />
      <CultivationParticles count={40} radius={12} colors={["#f97316", "#fbbf24", "#fdba74"]} />

    </>
  );
}
