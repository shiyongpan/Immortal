import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function PagodaLevel({ y, size, height }) {
  return (
    <group position={[0, y, 0]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[size, height, size]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Roof overhang */}
      <mesh position={[0, height / 2 + 0.12, 0]} castShadow>
        <boxGeometry args={[size + 1.2, 0.25, size + 1.2]} />
        <meshStandardMaterial color="#7c2c00" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Roof ridge */}
      <mesh position={[0, height / 2 + 0.35, 0]}>
        <boxGeometry args={[size - 0.4, 0.15, size - 0.4]} />
        <meshStandardMaterial color="#4a1a00" roughness={0.7} />
      </mesh>
      {/* Corner lanterns */}
      {[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([sx, sz], i) => (
        <mesh key={i} position={[(size / 2 + 0.4) * sx, height / 2 + 0.12, (size / 2 + 0.4) * sz]}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

export default function Pagoda({ position = [0, 0, 0] }) {
  const ref = useRef();

  return (
    <group ref={ref} position={position}>
      {/* Base platform */}
      <mesh receiveShadow>
        <boxGeometry args={[4.5, 0.5, 4.5]} />
        <meshStandardMaterial color="#2a1500" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Steps */}
      <mesh position={[0, -0.5, 2]}>
        <boxGeometry args={[2, 0.3, 0.6]} />
        <meshStandardMaterial color="#3a2000" roughness={0.8} />
      </mesh>

      {/* Levels bottom to top */}
      <PagodaLevel y={1.4}  size={3.2} height={1.6} />
      <PagodaLevel y={3.6}  size={2.2} height={1.4} />
      <PagodaLevel y={5.4}  size={1.4} height={1.2} />

      {/* Spire */}
      <mesh position={[0, 7.0, 0]} castShadow>
        <coneGeometry args={[0.2, 1.8, 6]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.2} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Spire orb */}
      <mesh position={[0, 6.0, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.55, 1.62]}>
        <boxGeometry args={[0.7, 1.0, 0.05]} />
        <meshStandardMaterial color="#4a2000" roughness={0.9} />
      </mesh>
    </group>
  );
}
