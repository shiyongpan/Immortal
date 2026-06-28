import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function CultivationParticles({ count = 60, radius = 12, colors = ["#fbbf24", "#818cf8", "#a78bfa", "#34d399"] }) {
  const mesh = useRef();

  const [positions, velocities, colorArr] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      pos[i * 3]     = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * 10 - 2;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      vel[i] = 0.008 + Math.random() * 0.015;
      c.set(colors[Math.floor(Math.random() * colors.length)]);
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, [count, radius]);

  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += velocities[i];
      if (pos[i * 3 + 1] > 12) {
        pos[i * 3 + 1] = -2;
      }
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArr, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}
