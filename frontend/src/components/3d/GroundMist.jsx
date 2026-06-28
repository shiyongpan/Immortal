import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

function spawnPuff(islandRadius) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * islandRadius * 0.84;
  return {
    x: Math.cos(angle) * r,
    y: 3.2 + Math.random() * 0.32,
    z: Math.sin(angle) * r,
    vx: (Math.random() - 0.5) * 0.18,
    vz: (Math.random() - 0.5) * 0.18,
    scale: 1.4 + Math.random() * 1.7,
    scaleY: 0.17 + Math.random() * 0.11,
    rotY: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.055,
    targetOpacity: 0.05 + Math.random() * 0.055,
    currentOpacity: 0,
    age: 0,
    lifetime: 12 + Math.random() * 16,
  };
}

export default function GroundMist({ count = 16, islandRadius = 8 }) {
  const meshRefs = useRef([]);
  const puffs    = useRef([]);

  useEffect(() => {
    puffs.current = Array.from({ length: count }, (_, i) => {
      const p = spawnPuff(islandRadius);
      // 錯開初始年齡，避免所有霧氣同時出現 / 消失
      p.age = Math.random() * p.lifetime;
      const ratio = p.age / p.lifetime;
      if (ratio > 0.18 && ratio < 0.78) p.currentOpacity = p.targetOpacity;
      return p;
    });
  }, [count, islandRadius]);

  useFrame((_, delta) => {
    puffs.current.forEach((p, i) => {
      p.age += delta;

      // 水平漂移
      p.x    += p.vx * delta;
      p.z    += p.vz * delta;
      p.rotY += p.rotSpeed * delta;

      // 垂直緩波（不累積位移，只在渲染時加上）
      const bob = Math.sin(p.age * 0.3 + i * 1.73) * 0.042;

      // 淡入 / 淡出
      const ratio = p.age / p.lifetime;
      if (ratio < 0.18) {
        p.currentOpacity = (ratio / 0.18) * p.targetOpacity;
      } else if (ratio > 0.78) {
        p.currentOpacity = Math.max(0, ((1 - ratio) / 0.22) * p.targetOpacity);
      } else {
        p.currentOpacity = p.targetOpacity;
      }

      // 生命結束 → 在新位置重生
      if (p.age >= p.lifetime) {
        puffs.current[i] = spawnPuff(islandRadius);
      }

      const mesh = meshRefs.current[i];
      if (!mesh) return;
      mesh.position.set(p.x, p.y + bob, p.z);
      mesh.rotation.y = p.rotY;
      mesh.scale.set(p.scale, p.scale * p.scaleY, p.scale);
      mesh.material.opacity = p.currentOpacity;
    });
  });

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 8, 5]} />
          <meshStandardMaterial
            color="#cce6ff"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
