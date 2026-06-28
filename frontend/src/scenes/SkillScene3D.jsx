import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import SkillPage from "../pages/game/SkillPage";
import CultivationParticles from "../components/3d/CultivationParticles";

function TrainingGround() {
  const dummyRefs = [useRef(), useRef(), useRef()];
  useFrame(({ clock }) => {
    dummyRefs.forEach((r, i) => {
      if (r.current) r.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5 + i * 1.5) * 0.3;
    });
  });

  return (
    <group>
      {/* Stone floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[35, 35]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} metalness={0.2} />
      </mesh>
      {[3, 6, 9].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <torusGeometry args={[r, 0.05, 6, 60]} />
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* Practice dummies */}
      {[[-5, 0, -4], [0, 0, -6], [5, 0, -4]].map(([x, y, z], i) => (
        <group ref={dummyRefs[i]} key={i} position={[x, y, z]}>
          {/* Post */}
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.2, 4, 6]} />
            <meshStandardMaterial color="#4a3728" roughness={0.9} />
          </mesh>
          {/* Body */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <boxGeometry args={[0.8, 1.2, 0.4]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.3} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 2.7, 0]} castShadow>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.3} />
          </mesh>
          {/* Skill glow */}
          <mesh position={[0, 1.8, 0]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={1.5} transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      {/* Skill book pedestal */}
      <group position={[0, 0, -9]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.8, 1, 1.2, 8]} />
          <meshStandardMaterial color="#1a0a00" roughness={0.8} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.8, 0]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[1, 1.3, 0.1]} />
          <meshStandardMaterial color="#1a3a4a" roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={4} />
        </mesh>
      </group>

      {/* Corner torches */}
      {[[-10, 0, -10], [10, 0, -10], [-10, 0, 6], [10, 0, 6]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.2, 3, 5]} />
            <meshStandardMaterial color="#4a3728" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={4} />
          </mesh>
          <pointLight position={[x, y + 1.7, z]} intensity={1.5} color="#60a5fa" distance={8} />
        </group>
      ))}
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

export function SkillHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <BackNav />
      <div className="absolute top-0 right-0 w-[52%] h-full bg-black/70 backdrop-blur-sm border-l border-blue-900/30 overflow-y-auto pointer-events-auto">
        <div className="p-4">
          <SkillPage />
        </div>
      </div>
    </div>
  );
}

export default function SkillScene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[14, 6, 10]} fov={60} />

      <ambientLight intensity={0.2} color="#000814" />
      <pointLight position={[0, 10, -4]} intensity={3} color="#60a5fa" distance={60} />
      <pointLight position={[-6, 5, 2]} intensity={1.5} color="#818cf8" distance={40} />
      <pointLight position={[6, 5, 2]} intensity={1.5} color="#60a5fa" distance={40} />

      <TrainingGround />
      <CultivationParticles count={50} radius={12} colors={["#60a5fa", "#818cf8", "#93c5fd", "#bfdbfe"]} />

    </>
  );
}
