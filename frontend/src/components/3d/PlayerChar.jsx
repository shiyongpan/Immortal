import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ROBE_DARK   = "#3b0764";
const ROBE_MID    = "#4c1d95";
const INNER_ROBE  = "#e8edf5";
const SKIN        = "#f0c8a0";
const SKIN_DARK   = "#e8b888";
const HAIR        = "#150800";
const GOLD        = "#d97706";
const GOLD_EMIT   = "#b45309";

export default function PlayerChar({ position = [0, 0, 0] }) {
  const groupRef = useRef();
  const auraRef  = useRef();
  const beadRef  = useRef();
  const base = position[1];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = base + Math.sin(t * 0.5) * 0.08 + 0.05;
    }
    if (auraRef.current) {
      auraRef.current.rotation.y = t * 0.45;
      auraRef.current.rotation.x = Math.sin(t * 0.32) * 0.1;
    }
    if (beadRef.current) {
      beadRef.current.rotation.y = t * 0.28;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], base, position[2]]}>

      {/* ── 盤腿 ─────────────────────────────────────────────── */}
      {/* Left thigh */}
      <mesh position={[-0.21, 0.12, 0.18]} rotation={[0.85, 0, 0.65]}>
        <capsuleGeometry args={[0.115, 0.32, 6, 10]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Right thigh */}
      <mesh position={[0.21, 0.12, 0.18]} rotation={[0.85, 0, -0.65]}>
        <capsuleGeometry args={[0.115, 0.32, 6, 10]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Left shin */}
      <mesh position={[-0.38, 0.08, 0.06]} rotation={[0.2, 0, 1.1]}>
        <capsuleGeometry args={[0.095, 0.28, 6, 10]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Right shin */}
      <mesh position={[0.38, 0.08, 0.06]} rotation={[0.2, 0, -1.1]}>
        <capsuleGeometry args={[0.095, 0.28, 6, 10]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Left foot */}
      <mesh position={[0.28, 0.07, 0.38]} rotation={[0.15, 0.2, 0.25]}>
        <capsuleGeometry args={[0.07, 0.16, 4, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.68} />
      </mesh>
      {/* Right foot */}
      <mesh position={[-0.28, 0.07, 0.38]} rotation={[0.15, -0.2, -0.25]}>
        <capsuleGeometry args={[0.07, 0.16, 4, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.68} />
      </mesh>
      {/* Robe draping over legs */}
      <mesh position={[0, 0.06, 0.12]} rotation={[-0.18, 0, 0]}>
        <sphereGeometry args={[0.46, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshStandardMaterial color={ROBE_DARK} roughness={0.88} side={THREE.DoubleSide} />
      </mesh>

      {/* ── 腰帶 ─────────────────────────────────────────────── */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.225, 0.265, 0.1, 12]} />
        <meshStandardMaterial color={ROBE_DARK} roughness={0.8} />
      </mesh>
      {/* Gold sash */}
      <mesh position={[0, 0.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.245, 0.028, 6, 28]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD_EMIT} emissiveIntensity={0.55} metalness={0.6} roughness={0.35} />
      </mesh>

      {/* ── 軀幹 ─────────────────────────────────────────────── */}
      {/* Inner robe (white) */}
      <mesh position={[0, 0.63, 0.01]}>
        <capsuleGeometry args={[0.185, 0.3, 8, 12]} />
        <meshStandardMaterial color={INNER_ROBE} roughness={0.72} />
      </mesh>
      {/* Outer robe */}
      <mesh position={[0, 0.61, 0]}>
        <capsuleGeometry args={[0.225, 0.26, 8, 12]} />
        <meshStandardMaterial color={ROBE_DARK} roughness={0.86} transparent opacity={0.93} />
      </mesh>
      {/* Gold hem on robe bottom */}
      <mesh position={[0, 0.485, 0.2]}>
        <boxGeometry args={[0.36, 0.035, 0.02]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD_EMIT} emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Collar left flap */}
      <mesh position={[-0.075, 0.74, 0.17]} rotation={[0.25, -0.15, -0.45]}>
        <boxGeometry args={[0.055, 0.26, 0.035]} />
        <meshStandardMaterial color={INNER_ROBE} roughness={0.65} />
      </mesh>
      {/* Collar right flap */}
      <mesh position={[0.075, 0.74, 0.17]} rotation={[0.25, 0.15, 0.45]}>
        <boxGeometry args={[0.055, 0.26, 0.035]} />
        <meshStandardMaterial color={INNER_ROBE} roughness={0.65} />
      </mesh>

      {/* ── 肩膀 ─────────────────────────────────────────────── */}
      <mesh position={[-0.275, 0.75, 0]}>
        <sphereGeometry args={[0.105, 10, 8]} />
        <meshStandardMaterial color={ROBE_DARK} roughness={0.86} />
      </mesh>
      <mesh position={[0.275, 0.75, 0]}>
        <sphereGeometry args={[0.105, 10, 8]} />
        <meshStandardMaterial color={ROBE_DARK} roughness={0.86} />
      </mesh>

      {/* ── 左臂 ─────────────────────────────────────────────── */}
      {/* Upper arm */}
      <mesh position={[-0.325, 0.62, 0.1]} rotation={[0.62, 0, 0.42]}>
        <capsuleGeometry args={[0.072, 0.21, 5, 8]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Forearm */}
      <mesh position={[-0.36, 0.46, 0.29]} rotation={[1.08, 0, 0.18]}>
        <capsuleGeometry args={[0.062, 0.19, 5, 8]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Wrist */}
      <mesh position={[-0.34, 0.33, 0.43]}>
        <sphereGeometry args={[0.058, 8, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* Left hand palm */}
      <mesh position={[-0.32, 0.29, 0.49]} rotation={[-0.35, 0, 0.1]}>
        <boxGeometry args={[0.1, 0.06, 0.11]} />
        <meshStandardMaterial color={SKIN} roughness={0.68} />
      </mesh>
      {/* Fingers L (4 stubs) */}
      {[-0.03, -0.01, 0.01, 0.03].map((xOff, i) => (
        <mesh key={i} position={[-0.32 + xOff * 2.8, 0.27, 0.555]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.013, 0.05, 3, 6]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.7} />
        </mesh>
      ))}
      {/* Left thumb */}
      <mesh position={[-0.265, 0.3, 0.485]} rotation={[0.1, 0.2, 0.85]}>
        <capsuleGeometry args={[0.015, 0.055, 3, 6]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.7} />
      </mesh>

      {/* ── 右臂 ─────────────────────────────────────────────── */}
      {/* Upper arm */}
      <mesh position={[0.325, 0.62, 0.1]} rotation={[0.62, 0, -0.42]}>
        <capsuleGeometry args={[0.072, 0.21, 5, 8]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Forearm */}
      <mesh position={[0.36, 0.46, 0.29]} rotation={[1.08, 0, -0.18]}>
        <capsuleGeometry args={[0.062, 0.19, 5, 8]} />
        <meshStandardMaterial color={ROBE_MID} roughness={0.82} />
      </mesh>
      {/* Wrist */}
      <mesh position={[0.34, 0.33, 0.43]}>
        <sphereGeometry args={[0.058, 8, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {/* Right hand palm */}
      <mesh position={[0.32, 0.29, 0.49]} rotation={[-0.35, 0, -0.1]}>
        <boxGeometry args={[0.1, 0.06, 0.11]} />
        <meshStandardMaterial color={SKIN} roughness={0.68} />
      </mesh>
      {/* Fingers R */}
      {[-0.03, -0.01, 0.01, 0.03].map((xOff, i) => (
        <mesh key={i} position={[0.32 + xOff * 2.8, 0.27, 0.555]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.013, 0.05, 3, 6]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.7} />
        </mesh>
      ))}
      {/* Right thumb */}
      <mesh position={[0.265, 0.3, 0.485]} rotation={[0.1, -0.2, -0.85]}>
        <capsuleGeometry args={[0.015, 0.055, 3, 6]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.7} />
      </mesh>

      {/* ── 頸部 ─────────────────────────────────────────────── */}
      <mesh position={[0, 0.9, 0.02]}>
        <cylinderGeometry args={[0.075, 0.095, 0.15, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.62} />
      </mesh>

      {/* ── 頭部 ─────────────────────────────────────────────── */}
      <mesh position={[0, 1.08, 0]}>
        <sphereGeometry args={[0.265, 20, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.62} />
      </mesh>
      {/* Jawline */}
      <mesh position={[0, 0.895, 0.05]} rotation={[-0.22, 0, 0]}>
        <capsuleGeometry args={[0.135, 0.07, 5, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.62} />
      </mesh>

      {/* Eyes */}
      {/* Left eye white */}
      <mesh position={[-0.098, 1.09, 0.224]}>
        <sphereGeometry args={[0.036, 10, 10]} />
        <meshStandardMaterial color="#f8f8f0" roughness={0.1} />
      </mesh>
      {/* Left iris */}
      <mesh position={[-0.098, 1.09, 0.246]}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshStandardMaterial color="#1a0a0a" roughness={0.2} />
      </mesh>
      {/* Left highlight */}
      <mesh position={[-0.088, 1.097, 0.258]}>
        <sphereGeometry args={[0.008, 5, 5]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      {/* Left eyelid upper */}
      <mesh position={[-0.098, 1.1, 0.235]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.008, 0.058, 3, 6]} />
        <meshStandardMaterial color={HAIR} roughness={0.6} />
      </mesh>

      {/* Right eye white */}
      <mesh position={[0.098, 1.09, 0.224]}>
        <sphereGeometry args={[0.036, 10, 10]} />
        <meshStandardMaterial color="#f8f8f0" roughness={0.1} />
      </mesh>
      {/* Right iris */}
      <mesh position={[0.098, 1.09, 0.246]}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshStandardMaterial color="#1a0a0a" roughness={0.2} />
      </mesh>
      {/* Right highlight */}
      <mesh position={[0.108, 1.097, 0.258]}>
        <sphereGeometry args={[0.008, 5, 5]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      {/* Right eyelid upper */}
      <mesh position={[0.098, 1.1, 0.235]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.008, 0.058, 3, 6]} />
        <meshStandardMaterial color={HAIR} roughness={0.6} />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.098, 1.128, 0.218]} rotation={[0.35, 0, 0.18]}>
        <capsuleGeometry args={[0.011, 0.068, 3, 6]} />
        <meshStandardMaterial color={HAIR} roughness={0.8} />
      </mesh>
      <mesh position={[0.098, 1.128, 0.218]} rotation={[0.35, 0, -0.18]}>
        <capsuleGeometry args={[0.011, 0.068, 3, 6]} />
        <meshStandardMaterial color={HAIR} roughness={0.8} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.038, 0.256]}>
        <sphereGeometry args={[0.02, 7, 7]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.65} />
      </mesh>
      <mesh position={[-0.024, 1.025, 0.254]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.7} />
      </mesh>
      <mesh position={[0.024, 1.025, 0.254]}>
        <sphereGeometry args={[0.014, 6, 6]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.7} />
      </mesh>

      {/* Lips */}
      <mesh position={[0, 0.972, 0.248]} rotation={[0.12, 0, 0]}>
        <capsuleGeometry args={[0.016, 0.068, 3, 8]} />
        <meshStandardMaterial color="#c46878" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.956, 0.245]} rotation={[0.08, 0, 0]}>
        <capsuleGeometry args={[0.013, 0.052, 3, 8]} />
        <meshStandardMaterial color="#b05868" roughness={0.5} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.258, 1.06, 0]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      <mesh position={[0.258, 1.06, 0]}>
        <sphereGeometry args={[0.052, 8, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.65} />
      </mesh>
      {/* Jade earring left */}
      <mesh position={[-0.27, 1.01, 0]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.27, 1.01, 0]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.2} />
      </mesh>

      {/* ── 頭髮 ─────────────────────────────────────────────── */}
      {/* Main hair cap */}
      <mesh position={[0, 1.13, -0.035]}>
        <sphereGeometry args={[0.275, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
        <meshStandardMaterial color={HAIR} roughness={0.88} />
      </mesh>
      {/* Temple hair L */}
      <mesh position={[-0.2, 1.01, 0.08]} rotation={[0.1, 0.28, 0.2]}>
        <capsuleGeometry args={[0.07, 0.1, 4, 8]} />
        <meshStandardMaterial color={HAIR} roughness={0.88} />
      </mesh>
      {/* Temple hair R */}
      <mesh position={[0.2, 1.01, 0.08]} rotation={[0.1, -0.28, -0.2]}>
        <capsuleGeometry args={[0.07, 0.1, 4, 8]} />
        <meshStandardMaterial color={HAIR} roughness={0.88} />
      </mesh>
      {/* Topknot cylinder */}
      <mesh position={[0, 1.36, 0]}>
        <cylinderGeometry args={[0.055, 0.085, 0.13, 10]} />
        <meshStandardMaterial color={HAIR} roughness={0.88} />
      </mesh>
      {/* Topknot bun */}
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.095, 12, 10]} />
        <meshStandardMaterial color={HAIR} roughness={0.88} />
      </mesh>
      {/* Hair ring accent */}
      <mesh position={[0, 1.355, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.078, 0.012, 5, 16]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD_EMIT} emissiveIntensity={0.5} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── 髮簪 ─────────────────────────────────────────────── */}
      {/* Main pin */}
      <mesh position={[0.065, 1.48, 0]} rotation={[0, 0, 0.22]}>
        <cylinderGeometry args={[0.01, 0.01, 0.58, 6]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD_EMIT} emissiveIntensity={0.7} metalness={0.92} roughness={0.08} />
      </mesh>
      {/* Pin gem */}
      <mesh position={[0.103, 1.635, 0]} rotation={[0, 0, 0.22]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={2.5} />
      </mesh>
      {/* Cross pin */}
      <mesh position={[-0.02, 1.48, 0.05]} rotation={[0.3, 0, -0.1]}>
        <cylinderGeometry args={[0.008, 0.008, 0.38, 5]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD_EMIT} emissiveIntensity={0.5} metalness={0.88} roughness={0.1} />
      </mesh>

      {/* ── 飄浮念珠 ─────────────────────────────────────────── */}
      <group ref={beadRef} position={[0, 0.58, 0]}>
        {Array.from({ length: 20 }).map((_, i) => {
          const a = (i / 20) * Math.PI * 2;
          const r = 0.55;
          return (
            <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * 0.07, Math.sin(a) * r]}>
              <sphereGeometry args={[i % 5 === 0 ? 0.042 : 0.028, 6, 6]} />
              <meshStandardMaterial
                color={i % 5 === 0 ? GOLD : "#c4b5fd"}
                emissive={i % 5 === 0 ? GOLD_EMIT : "#818cf8"}
                emissiveIntensity={i % 5 === 0 ? 1.8 : 0.9}
                metalness={i % 5 === 0 ? 0.55 : 0}
                roughness={0.35}
              />
            </mesh>
          );
        })}
      </group>

      {/* ── 修煉靈氣光環 ──────────────────────────────────────── */}
      <group ref={auraRef} position={[0, 0.12, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.038, 6, 48]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2.8} transparent opacity={0.78} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          <torusGeometry args={[0.7, 0.028, 6, 40]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={2.6} transparent opacity={0.68} />
        </mesh>
        <mesh rotation={[Math.PI / 3.2, 0, 0]}>
          <torusGeometry args={[0.78, 0.022, 6, 40]} />
          <meshStandardMaterial color="#c4b5fd" emissive="#c4b5fd" emissiveIntensity={2.2} transparent opacity={0.52} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0, Math.PI / 5]}>
          <torusGeometry args={[1.12, 0.018, 5, 56]} />
          <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.6} transparent opacity={0.32} />
        </mesh>
      </group>

      {/* ── 底部光暈 ──────────────────────────────────────────── */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.8} transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={4} transparent opacity={0.38} />
      </mesh>

    </group>
  );
}
