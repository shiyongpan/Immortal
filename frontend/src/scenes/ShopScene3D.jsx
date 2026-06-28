import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import ShopPage from "../pages/game/ShopPage";
import CultivationParticles from "../components/3d/CultivationParticles";

function ShopEnvironment() {
  const chandRef = useRef();
  useFrame(({ clock }) => {
    if (chandRef.current) chandRef.current.rotation.y = clock.getElapsedTime() * 0.08;
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0814" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Floor rune */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <torusGeometry args={[8, 0.06, 6, 80]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.5} />
      </mesh>

      {/* Display pedestals with item orbs */}
      {[[-5, 0, -4], [0, 0, -5], [5, 0, -4], [-7, 0, -1], [7, 0, -1]].map(([x, y, z], i) => {
        const colors = ["#fbbf24", "#818cf8", "#34d399", "#f97316", "#e879f9"];
        return (
          <group key={i} position={[x, y, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.5, 0.7, 1.2, 8]} />
              <meshStandardMaterial color="#1a0a00" roughness={0.7} metalness={0.4} />
            </mesh>
            <mesh position={[0, 1.0, 0]}>
              <sphereGeometry args={[0.35, 10, 10]} />
              <meshStandardMaterial color={colors[i]} emissive={colors[i]} emissiveIntensity={2} transparent opacity={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Hanging chandelier */}
      <group ref={chandRef} position={[0, 8, -2]}>
        <mesh>
          <torusGeometry args={[2, 0.08, 6, 32]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} metalness={0.8} />
        </mesh>
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={deg} position={[Math.cos(rad) * 2, 0, Math.sin(rad) * 2]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={4} />
            </mesh>
          );
        })}
      </group>

      {/* Side columns */}
      {[[-10, 0, -8], [10, 0, -8], [-10, 0, 4], [10, 0, 4]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.6, 10, 8]} />
            <meshStandardMaterial color="#1a0a00" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[0, 5.2, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={2.5} />
          </mesh>
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

export function ShopHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <BackNav />
      <div className="absolute top-0 right-0 w-[52%] h-full bg-black/70 backdrop-blur-sm border-l border-green-900/30 overflow-y-auto pointer-events-auto">
        <div className="p-4">
          <ShopPage />
        </div>
      </div>
    </div>
  );
}

export default function ShopScene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[14, 7, 12]} fov={60} />

      <ambientLight intensity={0.25} color="#0a1a0a" />
      <pointLight position={[0, 10, 0]} intensity={3} color="#34d399" distance={50} />
      <pointLight position={[-8, 5, 2]} intensity={1.5} color="#fbbf24" distance={40} />
      <pointLight position={[8, 5, 2]} intensity={1.5} color="#34d399" distance={40} />

      <ShopEnvironment />
      <CultivationParticles count={50} radius={12} colors={["#34d399", "#fbbf24", "#6ee7b7"]} />

    </>
  );
}
