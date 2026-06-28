import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function FloatingRock({ position, size = 1, speed = 0.4 }) {
  const ref = useRef();
  const base = position[1];
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = base + Math.sin(clock.getElapsedTime() * speed + position[0]) * 0.25;
    ref.current.rotation.y += 0.003;
  });
  return (
    <mesh ref={ref} position={position} castShadow>
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color="#4a3a2e" roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

function Tree({ position, leafColor = "#2d7a1e" }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 1.2, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={1} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.7, 7, 7]} />
        <meshStandardMaterial color={leafColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

function GrassHill({ position, radius = 1.2, color = "#34a832" }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  );
}

function Flower({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 4]} />
        <meshStandardMaterial color="#4a7a1e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

function GlowMushroom({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.24, 5]} />
        <meshStandardMaterial color="#e8d5c0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.16, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color="#a78bfa" emissive="#818cf8" emissiveIntensity={1.2} roughness={0.5} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

export default function FloatingIsland({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* 主體岩石 */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[8.5, 3.5, 4.5, 14, 1]} />
        <meshStandardMaterial color="#3d2e1e" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* 草地頂面 - 明亮翠綠 */}
      <mesh receiveShadow position={[0, 2.3, 0]}>
        <cylinderGeometry args={[8.5, 8.5, 0.5, 14]} />
        <meshStandardMaterial color="#2ea832" roughness={0.88} />
      </mesh>

      {/* 土壤層 */}
      <mesh receiveShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[8.3, 8.3, 0.1, 14]} />
        <meshStandardMaterial color="#5a3d1e" roughness={0.9} />
      </mesh>

      {/* 草地小丘 */}
      <GrassHill position={[-3.5, 2.55, -3]} radius={1.3} color="#38b833" />
      <GrassHill position={[4, 2.55, 2.5]} radius={1.0} color="#2da82a" />
      <GrassHill position={[-1.5, 2.55, 5]} radius={0.9} color="#34b030" />
      <GrassHill position={[5.5, 2.55, -2.5]} radius={0.8} color="#30a82d" />
      <GrassHill position={[-5, 2.55, 2]} radius={1.1} color="#3ab035" />
      <GrassHill position={[2, 2.55, -5.5]} radius={0.75} color="#2da030" />

      {/* 岩石群 */}
      <mesh position={[-4, 2.8, -3]} rotation={[0.2, 0.5, 0.1]} castShadow>
        <dodecahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial color="#5a4a3e" roughness={0.95} />
      </mesh>
      <mesh position={[4.5, 2.7, 2]} rotation={[0.1, -0.3, 0.15]} castShadow>
        <dodecahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#4e3e30" roughness={0.95} />
      </mesh>
      <mesh position={[-2, 2.6, 5]} rotation={[0.3, 1.1, 0.2]} castShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#5a4a3e" roughness={0.95} />
      </mesh>

      {/* 鐘乳石 */}
      {[[-3, -3, -1], [0, -2.5, 2], [3, -3.5, -2], [-1.5, -2, 3.5], [2, -3, 1], [-4, -2.5, 2]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI, Math.random() * 0.5, 0]} castShadow>
          <coneGeometry args={[0.3 + i * 0.06, 2.5 + i * 0.3, 5]} />
          <meshStandardMaterial color="#2e1e0e" roughness={0.95} />
        </mesh>
      ))}

      {/* 樹木 - 多色葉子 */}
      <Tree position={[-5.5, 2.5, 1]} leafColor="#2d8a1e" />
      <Tree position={[5, 2.5, -1]} leafColor="#3a9e28" />
      <Tree position={[-3, 2.5, 5.5]} leafColor="#1e7a30" />
      <Tree position={[3, 2.5, 5]} leafColor="#4a9e20" />
      <Tree position={[6, 2.5, 1.5]} leafColor="#24882e" />
      <Tree position={[-5, 2.5, -4]} leafColor="#2e9e25" />

      {/* 花卉 */}
      <Flower position={[2.5, 2.55, 4]} color="#f472b6" />
      <Flower position={[-2, 2.55, 4.5]} color="#fb923c" />
      <Flower position={[5, 2.55, 0.5]} color="#facc15" />
      <Flower position={[-4.5, 2.55, 0.5]} color="#f87171" />
      <Flower position={[1, 2.55, -5]} color="#c084fc" />
      <Flower position={[-3, 2.55, -4.5]} color="#38bdf8" />
      <Flower position={[3.5, 2.55, -3.5]} color="#fb923c" />
      <Flower position={[-1, 2.55, 6]} color="#f472b6" />
      <Flower position={[6, 2.55, -3]} color="#a3e635" />

      {/* 發光蘑菇 */}
      <GlowMushroom position={[-4, 2.55, 1]} />
      <GlowMushroom position={[3, 2.55, -4]} />
      <GlowMushroom position={[5.5, 2.55, 3]} />
      <GlowMushroom position={[-2.5, 2.55, -5]} />

      {/* 周圍漂浮岩石 */}
      <FloatingRock position={[-13, 2, 3]} size={1.2} speed={0.35} />
      <FloatingRock position={[12, 1.5, -5]} size={0.9} speed={0.45} />
      <FloatingRock position={[-10, -1, -7]} size={1.5} speed={0.3} />
      <FloatingRock position={[9, 3, 7]} size={0.7} speed={0.5} />
      <FloatingRock position={[-6, 4, -10]} size={1.0} speed={0.38} />
    </group>
  );
}
