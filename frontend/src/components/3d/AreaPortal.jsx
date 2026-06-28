import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

export default function AreaPortal({ position = [0,0,0], label = "", icon = "✦", color = "#fbbf24", onClick, rotY = 0 }) {
  const panelRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!panelRef.current) return;
    panelRef.current.material.emissiveIntensity = 0.5 + Math.sin(clock.getElapsedTime() * 1.6 + position[0]) * 0.22;
  });

  return (
    <group
      position={position}
      rotation={[0, rotY, 0]}
      scale={hovered ? 1.1 : 1.0}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
    >
      {/* 外框石板 */}
      <mesh position={[0, 0, -0.07]}>
        <boxGeometry args={[2.1, 2.75, 0.1]} />
        <meshStandardMaterial color="#1a1228" roughness={0.8} metalness={0.4} />
      </mesh>

      {/* 面板主體（帶靈氣脈動） */}
      <mesh ref={panelRef}>
        <boxGeometry args={[1.9, 2.55, 0.06]} />
        <meshStandardMaterial color="#070510" emissive={color} emissiveIntensity={0.5} roughness={0.25} metalness={0.2} />
      </mesh>

      {/* 邊框光條 */}
      <mesh position={[0,  1.3, 0]}><boxGeometry args={[1.92, 0.045, 0.09]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} /></mesh>
      <mesh position={[0, -1.3, 0]}><boxGeometry args={[1.92, 0.045, 0.09]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} /></mesh>
      <mesh position={[-0.97, 0, 0]}><boxGeometry args={[0.045, 2.6, 0.09]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} /></mesh>
      <mesh position={[ 0.97, 0, 0]}><boxGeometry args={[0.045, 2.6, 0.09]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} /></mesh>

      {/* 四角光珠 */}
      {[[-0.88, 1.2], [0.88, 1.2], [-0.88, -1.2], [0.88, -1.2]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.06]}>
          <sphereGeometry args={[0.065, 6, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={6} />
        </mesh>
      ))}

      {/* 圖示 */}
      <Text position={[0, 0.6, 0.08]} fontSize={0.78} anchorX="center" anchorY="middle">
        {icon}
      </Text>

      {/* 分隔線 */}
      <mesh position={[0, 0.02, 0.05]}>
        <boxGeometry args={[1.5, 0.022, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} transparent opacity={0.55} />
      </mesh>

      {/* 標籤 */}
      <Text position={[0, -0.6, 0.08]} fontSize={0.3} color={color} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000">
        {label}
      </Text>

      {/* 面板前方補光 */}
      <pointLight position={[0, 0, 0.8]} color={color} intensity={hovered ? 3 : 1.2} distance={4} />
    </group>
  );
}
