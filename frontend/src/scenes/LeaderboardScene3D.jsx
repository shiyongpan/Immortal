import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Text } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import LeaderboardPage from "../pages/game/LeaderboardPage";
import CultivationParticles from "../components/3d/CultivationParticles";

function HallOfFame() {
  const crownRef = useRef();
  useFrame(({ clock }) => {
    if (crownRef.current) {
      crownRef.current.rotation.y = clock.getElapsedTime() * 0.4;
      crownRef.current.position.y = 8 + Math.sin(clock.getElapsedTime() * 0.8) * 0.2;
    }
  });

  const PEDESTAL_COLORS = [["#fbbf24", "#92400e"], ["#94a3b8", "#334155"], ["#d97706", "#78350f"]];
  const PEDESTAL_H = [3, 2, 2.5];

  return (
    <group>
      {/* Grand floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#080808" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Radial floor pattern */}
      {[4, 8, 12].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <torusGeometry args={[r, 0.05, 6, 80]} />
          <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={1} />
        </mesh>
      ))}

      {/* Trophy pedestals for top 3 */}
      {[0, -4, 4].map((x, i) => (
        <group key={i} position={[x, 0, -6]}>
          <mesh castShadow>
            <boxGeometry args={[2.5, PEDESTAL_H[i], 2.5]} />
            <meshStandardMaterial color={PEDESTAL_COLORS[i][1]} roughness={0.7} metalness={0.4} />
          </mesh>
          {/* Rank number */}
          <Text
            position={[0, PEDESTAL_H[i] / 2 + 0.2, 1.3]}
            fontSize={0.6}
            color={PEDESTAL_COLORS[i][0]}
            anchorX="center"
            outlineWidth={0.05}
            outlineColor="#000"
          >
            {i === 0 ? "No.1" : i === 1 ? "No.2" : "No.3"}
          </Text>
          {/* Trophy orb */}
          <mesh position={[0, PEDESTAL_H[i] / 2 + 0.6, 0]}>
            <sphereGeometry args={[0.4, 10, 10]} />
            <meshStandardMaterial
              color={PEDESTAL_COLORS[i][0]}
              emissive={PEDESTAL_COLORS[i][0]}
              emissiveIntensity={i === 0 ? 3 : 2}
              metalness={0.6}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Floating crown above first place */}
      <group ref={crownRef} position={[0, 8, -6]}>
        <mesh>
          <torusGeometry args={[0.6, 0.12, 8, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} metalness={0.8} roughness={0.1} />
        </mesh>
        {[0, 72, 144, 216, 288].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={deg} position={[Math.cos(rad) * 0.6, 0.2, Math.sin(rad) * 0.6]}>
              <coneGeometry args={[0.08, 0.4, 5]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} />
            </mesh>
          );
        })}
      </group>

      {/* Side hall columns */}
      {[-9, -6, 6, 9].map((x, i) => (
        <group key={i} position={[x, 0, -3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.5, 10, 8]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[0, 5.3, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={3} />
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

export function LeaderboardHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <BackNav />
      <div className="absolute top-0 right-0 w-[52%] h-full bg-black/70 backdrop-blur-sm border-l border-purple-900/30 overflow-y-auto pointer-events-auto">
        <div className="p-4">
          <LeaderboardPage />
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardScene3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[14, 7, 12]} fov={60} />

      <ambientLight intensity={0.2} color="#1a001a" />
      <pointLight position={[0, 12, -6]} intensity={4} color="#e879f9" distance={60} />
      <pointLight position={[-6, 6, 2]} intensity={2} color="#fbbf24" distance={40} />
      <pointLight position={[6, 6, 2]} intensity={2} color="#e879f9" distance={40} />

      <HallOfFame />
      <CultivationParticles count={60} radius={14} colors={["#e879f9", "#fbbf24", "#f0abfc", "#c026d3"]} />

    </>
  );
}
