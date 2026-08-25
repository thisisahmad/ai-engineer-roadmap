"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Hero scene: a layered neural / agent network with signals propagating
 * left to right through it.
 *
 * The subject is deliberate — this is a learning site for AI engineering, so
 * the background is a network being traversed rather than abstract shapes.
 * Layout is seeded, not random, so the composition is the same on every load.
 *
 * No drei <Environment> here: that fetches an HDRI from a CDN at runtime.
 * Everything is lit explicitly so the scene works offline.
 */

/** Node counts per layer, read left to right. Widening then narrowing reads
 *  as a network rather than a grid. */
const LAYERS = [4, 6, 7, 6, 4];
const LAYER_GAP = 3.1;
const PULSE_COUNT = 44;

const COLOR_IN = new THREE.Color("#8b5cf6"); // violet
const COLOR_OUT = new THREE.Color("#22d3ee"); // cyan

/** Deterministic PRNG, so the layout never shifts between reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Node = {
  position: THREE.Vector3;
  color: THREE.Color;
  layer: number;
  scale: number;
};

function buildNetwork() {
  const random = mulberry32(20260825);
  const nodes: Node[] = [];
  const layerRanges: { start: number; count: number }[] = [];

  LAYERS.forEach((count, layer) => {
    layerRanges.push({ start: nodes.length, count });

    const x = (layer - (LAYERS.length - 1) / 2) * LAYER_GAP;
    const color = COLOR_IN.clone().lerp(COLOR_OUT, layer / (LAYERS.length - 1));

    for (let i = 0; i < count; i++) {
      // Even vertical spread with a small seeded offset, so the layers read as
      // organised without looking like graph paper.
      const spread = 4.6;
      const y = ((i - (count - 1) / 2) / Math.max(count - 1, 1)) * spread;
      const jitterY = (random() - 0.5) * 0.42;
      const z = (random() - 0.5) * 3.4;

      nodes.push({
        position: new THREE.Vector3(x, y + jitterY, z),
        color,
        layer,
        scale: 0.055 + random() * 0.055,
      });
    }
  });

  // Connect each node to a seeded subset of the next layer. A full bipartite
  // mesh turns into visual soup at this node count.
  const edges: { from: number; to: number }[] = [];
  for (let layer = 0; layer < layerRanges.length - 1; layer++) {
    const a = layerRanges[layer];
    const b = layerRanges[layer + 1];

    for (let i = 0; i < a.count; i++) {
      const targets = new Set<number>();
      const wanted = 2 + Math.floor(random() * 2);
      while (targets.size < Math.min(wanted, b.count)) {
        targets.add(Math.floor(random() * b.count));
      }
      for (const t of targets) {
        edges.push({ from: a.start + i, to: b.start + t });
      }
    }
  }

  return { nodes, edges };
}

function Network() {
  const group = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Points>(null);

  const { nodes, edges } = useMemo(buildNetwork, []);

  /** Edge geometry, coloured per-vertex so connections fade along their run. */
  const { linePositions, lineColors } = useMemo(() => {
    const linePositions = new Float32Array(edges.length * 6);
    const lineColors = new Float32Array(edges.length * 6);

    edges.forEach((edge, i) => {
      const from = nodes[edge.from];
      const to = nodes[edge.to];

      linePositions.set([from.position.x, from.position.y, from.position.z], i * 6);
      linePositions.set([to.position.x, to.position.y, to.position.z], i * 6 + 3);
      lineColors.set([from.color.r, from.color.g, from.color.b], i * 6);
      lineColors.set([to.color.r, to.color.g, to.color.b], i * 6 + 3);
    });

    return { linePositions, lineColors };
  }, [nodes, edges]);

  /** Signals travelling along edges. Each keeps its own edge and speed. */
  const pulses = useMemo(() => {
    const random = mulberry32(99117);
    return Array.from({ length: PULSE_COUNT }, () => ({
      edge: Math.floor(random() * edges.length),
      t: random(),
      speed: 0.16 + random() * 0.3,
    }));
  }, [edges]);

  const pulseData = useMemo(() => {
    return {
      positions: new Float32Array(PULSE_COUNT * 3),
      colors: new Float32Array(PULSE_COUNT * 3),
    };
  }, []);

  useFrame((state, delta) => {
    // Slow drift keeps the scene alive without competing with the headline.
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.09) * 0.16;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.06) * 0.05;
    }

    if (!pulseRef.current) return;

    const { positions, colors } = pulseData;

    for (let i = 0; i < pulses.length; i++) {
      const pulse = pulses[i];
      pulse.t += delta * pulse.speed;

      if (pulse.t > 1) {
        pulse.t = 0;
        // Re-home the signal so traffic keeps redistributing across the graph.
        pulse.edge = Math.floor(Math.random() * edges.length);
      }

      const edge = edges[pulse.edge];
      const from = nodes[edge.from];
      const to = nodes[edge.to];

      // Ease the travel so signals accelerate out of a node and settle into
      // the next one, rather than sliding at constant speed.
      const eased = pulse.t * pulse.t * (3 - 2 * pulse.t);

      positions[i * 3] = from.position.x + (to.position.x - from.position.x) * eased;
      positions[i * 3 + 1] = from.position.y + (to.position.y - from.position.y) * eased;
      positions[i * 3 + 2] = from.position.z + (to.position.z - from.position.z) * eased;

      colors[i * 3] = from.color.r + (to.color.r - from.color.r) * eased;
      colors[i * 3 + 1] = from.color.g + (to.color.g - from.color.g) * eased;
      colors[i * 3 + 2] = from.color.b + (to.color.b - from.color.b) * eased;
    }

    const geometry = pulseRef.current.geometry;
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <group ref={group}>
      {/* Connections */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.17}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position} scale={node.scale}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={2.4}
            roughness={0.25}
            metalness={0.1}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Travelling signals */}
      <points ref={pulseRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pulseData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[pulseData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.13}
          vertexColors
          transparent
          opacity={0.95}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/** Sparse dust well behind the network, for depth only. */
function Depth({ count = 260 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const random = mulberry32(5150);
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      array[i * 3] = (random() - 0.5) * 30;
      array[i * 3 + 1] = (random() - 0.5) * 16;
      array[i * 3 + 2] = -6 - random() * 16;
    }
    return array;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#6d5ce7"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Damped pointer parallax — depth cue, not a cursor-follow effect. */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (!group.current) return;
    const targetX = (state.pointer.x * viewport.width) / 44;
    const targetY = (state.pointer.y * viewport.height) / 44;
    const damp = 1 - Math.pow(0.0015, delta);
    group.current.position.x += (targetX - group.current.position.x) * damp;
    group.current.position.y += (targetY - group.current.position.y) * damp;
  });

  return <group ref={group}>{children}</group>;
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 13], fov: 42 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 8]} intensity={30} color="#a78bfa" />

      <ParallaxRig>
        <Depth />
        <Network />
      </ParallaxRig>

      <fog attach="fog" args={["#08080c", 14, 34]} />
    </Canvas>
  );
}
