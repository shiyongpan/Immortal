import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function MonsterBody({ type = "beast", color = "#22c55e", emissive = "#15803d", attacking = false }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    if (attacking) {
      ref.current.position.x = Math.sin(t * 20) * 0.15;
    } else {
      ref.current.position.y = Math.sin(t * 1.2) * 0.08;
    }
  });

  if (type === "slime") {
    return (
      <group ref={ref}>
        <mesh castShadow>
          <sphereGeometry args={[0.6, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} roughness={0.3} metalness={0.1} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.65, 10, 4, 0, Math.PI * 2, Math.PI * 0.7, Math.PI * 0.3]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} roughness={0.3} transparent opacity={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.2, 0.3, 0.5]}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.2, 0.3, 0.5]}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
      </group>
    );
  }

  if (type === "dragon") {
    return (
      <group ref={ref}>
        {/* Body */}
        <mesh castShadow position={[0, 0.3, 0]}>
          <capsuleGeometry args={[0.5, 1.2, 6, 10]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.3, 0.3]} castShadow>
          <boxGeometry args={[0.7, 0.5, 0.9]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.4} roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Horns */}
        <mesh position={[-0.2, 1.7, 0.1]} rotation={[0.3, 0, -0.4]}>
          <coneGeometry args={[0.08, 0.6, 5]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.2, 1.7, 0.1]} rotation={[0.3, 0, 0.4]}>
          <coneGeometry args={[0.08, 0.6, 5]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
        {/* Wings */}
        <mesh position={[-0.8, 0.8, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.9, 0.05, 0.7]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} transparent opacity={0.7} roughness={0.5} />
        </mesh>
        <mesh position={[0.8, 0.8, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.9, 0.05, 0.7]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} transparent opacity={0.7} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  // Default: beast/wolf
  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.9, 0.7, 1.4]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.7, 0.5]}>
        <boxGeometry args={[0.55, 0.55, 0.6]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} roughness={0.7} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.2, 1.05, 0.45]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.1, 0.3, 4]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 1.05, 0.45]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.1, 0.3, 4]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.18, 0.72, 0.8]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.18, 0.72, 0.8]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={2} />
      </mesh>
      {/* Legs */}
      {[[-0.35, 0.5], [0.35, 0.5], [-0.35, -0.5], [0.35, -0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.3, z]}>
          <boxGeometry args={[0.2, 0.5, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Resolve monster type from name/level
function resolveType(name = "", level = 1) {
  const n = name.toLowerCase();
  if (n.includes("龍") || n.includes("dragon")) return "dragon";
  if (n.includes("史萊姆") || n.includes("slime") || level <= 3) return "slime";
  return "beast";
}

// Resolve color from level
function resolveColor(level = 1) {
  if (level >= 20) return { color: "#c084fc", emissive: "#7c3aed" };
  if (level >= 15) return { color: "#f97316", emissive: "#c2410c" };
  if (level >= 10) return { color: "#60a5fa", emissive: "#1d4ed8" };
  if (level >= 5)  return { color: "#4ade80", emissive: "#15803d" };
  return { color: "#94a3b8", emissive: "#475569" };
}

export default function MonsterChar({ monster, position = [0, 0, 0], attacking = false, onClick }) {
  const type = resolveType(monster?.monster_name, monster?.level);
  const { color, emissive } = resolveColor(monster?.level);

  return (
    <group
      position={position}
      onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      <MonsterBody type={type} color={color} emissive={emissive} attacking={attacking} />
    </group>
  );
}
