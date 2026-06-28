import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import InventoryPage from "../pages/game/InventoryPage";
import CultivationParticles from "../components/3d/CultivationParticles";

function StorageChamber() {
  const ringRef = useRef();
  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.rotation.y = clock.getElapsedTime() * 0.2;
  });

  const gemColors = ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#a78bfa", "#fb923c"];

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 16]} />
        <meshStandardMaterial color="#0a0814" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <torusGeometry args={[7, 0.07, 6, 64]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={1.5} />
      </mesh>

      {/* Storage ring visual */}
      <group ref={ringRef} position={[0, 4, -4]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.2, 8, 32]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={1.5} metalness={0.7} roughness={0.2} />
        </mesh>
        {gemColors.map((c, i) => {
          const angle = (i / gemColors.length) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0]}>
              <octahedronGeometry args={[0.25, 0]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={3} metalness={0.5} roughness={0.1} />
            </mesh>
          );
        })}
      </group>

      {/* Shelves with item display */}
      {[-6, -3, 0, 3, 6].map((x, i) => (
        <group key={i} position={[x, 0, -8]}>
          <mesh>
            <boxGeometry args={[2.2, 0.1, 0.5]} />
            <meshStandardMaterial color="#1a0a00" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial
              color={gemColors[i % gemColors.length]}
              emissive={gemColors[i % gemColors.length]}
              emissiveIntensity={2.5}
              metalness={0.5}
              roughness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* Pillars */}
      {[0, 72, 144, 216, 288].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <group key={deg} position={[Math.cos(rad) * 10, 0, Math.sin(rad) * 10]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.4, 8, 7]} />
              <meshStandardMaterial color="#1a1a2e" roughness={0.9} metalness={0.3} />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={3} />
            </mesh>
          </group>
        );
      })}
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

export function InventoryHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <BackNav />
      <div className="absolute top-0 right-0 w-[52%] h-full bg-black/70 backdrop-blur-sm border-l border-purple-900/30 overflow-y-auto pointer-events-auto">
        <div className="p-4">
          <InventoryPage />
        </div>
      </div>
    </div>
  );
}

export default function InventoryScene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[14, 6, 10]} fov={60} />

      <ambientLight intensity={0.2} color="#10001a" />
      <pointLight position={[0, 10, -4]} intensity={3} color="#a78bfa" distance={50} />
      <pointLight position={[-6, 5, 2]} intensity={1.5} color="#818cf8" distance={40} />
      <pointLight position={[6, 5, 2]} intensity={1.5} color="#f472b6" distance={40} />

      <StorageChamber />
      <CultivationParticles count={50} radius={12} colors={["#818cf8", "#a78bfa", "#c4b5fd", "#f472b6"]} />

    </>
  );
}
