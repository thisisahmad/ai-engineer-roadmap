"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * Homepage hero: a GPU-rendered 3D node network.
 *
 * Nodes occupy a real volume — z position drives both scale and emissive
 * intensity, so depth reads without needing a depth-of-field pass. Links are
 * distance-based, so the graph looks locally clustered rather than uniformly
 * webbed.
 *
 * No drei <Environment>: that fetches an HDRI from a CDN. Everything is lit
 * explicitly so the scene works offline.
 */

/** Violet primary with an amber accent — deliberately not the usual
 *  violet+cyan that most AI products land on. */
const VIOLET = ["#8b5cf6", "#a78bfa", "#7c3aed"];
const AMBER = ["#f59e0b", "#fbbf24", "#f97316"];
const AMBER_SHARE = 0.3;

/** Squared link distance. Tuned so each node keeps ~2-4 neighbours at the
 *  desktop density; everything-to-everything reads as fog. */
const LINK_DIST_SQ = 3.05 ** 2;
const MAX_LINKS = 190;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type NodeSpec = {
  base: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  emissive: number;
  /** Phase offsets so idle drift is not synchronised across the cluster. */
  phase: THREE.Vector3;
  driftAmp: number;
};

function buildNodes(count: number) {
  const random = mulberry32(20260825);
  const nodes: NodeSpec[] = [];

  for (let i = 0; i < count; i++) {
    // Ellipsoid volume: wider than tall, with genuine z spread so the cluster
    // has front and back rather than being a scattered plane.
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = Math.cbrt(random()) * 7.4;

    const x = r * Math.sin(phi) * Math.cos(theta) * 1.42;
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.82;
    const z = r * Math.cos(phi) * 0.72;

    // Depth cue: nearer nodes are larger and brighter.
    const depthT = THREE.MathUtils.clamp((z + 5.4) / 10.8, 0, 1);
    const isAmber = random() < AMBER_SHARE;
    const palette = isAmber ? AMBER : VIOLET;

    nodes.push({
      base: new THREE.Vector3(x, y, z),
      color: new THREE.Color(palette[Math.floor(random() * palette.length)]),
      scale: THREE.MathUtils.lerp(0.032, 0.115, depthT) * (0.72 + random() * 0.6),
      emissive: THREE.MathUtils.lerp(1.15, 3.1, depthT),
      phase: new THREE.Vector3(
        random() * Math.PI * 2,
        random() * Math.PI * 2,
        random() * Math.PI * 2,
      ),
      driftAmp: 0.09 + random() * 0.16,
    });
  }

  return nodes;
}

/** Index pairs closer than the link threshold, nearest pairs kept first. */
function buildLinks(nodes: NodeSpec[]) {
  const pairs: { a: number; b: number; d: number }[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].base.distanceToSquared(nodes[j].base);
      if (d < LINK_DIST_SQ) pairs.push({ a: i, b: j, d });
    }
  }

  pairs.sort((p, q) => p.d - q.d);
  return pairs.slice(0, MAX_LINKS);
}

function Network({ count, animate }: { count: number; animate: boolean }) {
  const cluster = useRef<THREE.Group>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const nodes = useMemo(() => buildNodes(count), [count]);
  const links = useMemo(() => buildLinks(nodes), [nodes]);

  const { linePositions, lineColors } = useMemo(() => {
    const linePositions = new Float32Array(links.length * 6);
    const lineColors = new Float32Array(links.length * 6);

    links.forEach((link, i) => {
      const a = nodes[link.a];
      const b = nodes[link.b];
      linePositions.set([a.base.x, a.base.y, a.base.z], i * 6);
      linePositions.set([b.base.x, b.base.y, b.base.z], i * 6 + 3);
      // Fade the link with distance so the near pairs read strongest.
      const fade = 1 - link.d / LINK_DIST_SQ;
      lineColors.set([a.color.r * fade, a.color.g * fade, a.color.b * fade], i * 6);
      lineColors.set([b.color.r * fade, b.color.g * fade, b.color.b * fade], i * 6 + 3);
    });

    return { linePositions, lineColors };
  }, [nodes, links]);

  useFrame((state, delta) => {
    // Reduced motion renders one frame and never subscribes to updates.
    if (!animate) return;

    const t = state.clock.elapsedTime;

    if (cluster.current) cluster.current.rotation.y += delta * 0.045;

    // Idle drift, sin/cos rather than physics so it is cheap and bounded.
    for (let i = 0; i < nodes.length; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;
      const n = nodes[i];
      mesh.position.set(
        n.base.x + Math.sin(t * 0.42 + n.phase.x) * n.driftAmp,
        n.base.y + Math.cos(t * 0.37 + n.phase.y) * n.driftAmp,
        n.base.z + Math.sin(t * 0.31 + n.phase.z) * n.driftAmp * 0.7,
      );
    }

    // Links follow their endpoints, or they visibly detach as nodes drift.
    if (lines.current) {
      const attr = lines.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const array = attr.array as Float32Array;

      for (let i = 0; i < links.length; i++) {
        const a = meshes.current[links[i].a];
        const b = meshes.current[links[i].b];
        if (!a || !b) continue;
        array[i * 6] = a.position.x;
        array[i * 6 + 1] = a.position.y;
        array[i * 6 + 2] = a.position.z;
        array[i * 6 + 3] = b.position.x;
        array[i * 6 + 4] = b.position.y;
        array[i * 6 + 5] = b.position.z;
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={cluster}>
      <lineSegments ref={lines}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {nodes.map((node, i) => (
        <Sphere
          key={i}
          ref={(mesh) => {
            meshes.current[i] = mesh;
          }}
          args={[1, 14, 14]}
          position={node.base}
          scale={node.scale}
        >
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={node.emissive}
            roughness={0.3}
            metalness={0.1}
            // Unclamped so emissive pushes past 1.0 — this is what the bloom
            // threshold picks up, and what keeps nodes glowing when bloom is
            // disabled on low-power devices.
            toneMapped={false}
          />
        </Sphere>
      ))}
    </group>
  );
}

/**
 * Damped camera parallax. The camera itself lerps toward the pointer rather
 * than transforming the scene, so near and far nodes shift by different
 * amounts and the depth actually reads. Not OrbitControls — this is a
 * background, it must not be draggable.
 */
function CameraParallax() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 13));

  useFrame((state, delta) => {
    target.current.set(
      state.pointer.x * 1.35,
      state.pointer.y * 0.85,
      13,
    );
    camera.position.lerp(target.current, 1 - Math.pow(0.0016, delta));
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function HeroScene({
  density = "full",
  animate = true,
  bloom = true,
}: {
  density?: "full" | "reduced";
  animate?: boolean;
  bloom?: boolean;
}) {
  const count = density === "full" ? 92 : 46;

  return (
    <Canvas
      // "demand" renders a single frame for the reduced-motion case; the
      // animated path needs the continuous loop.
      frameloop={animate ? "always" : "demand"}
      dpr={[1, animate ? 1.75 : 2]}
      camera={{ position: [0, 0, 13], fov: 46 }}
      gl={{
        antialias: !bloom, // bloom's own pass supersedes MSAA
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 2, 9]} intensity={26} color="#a78bfa" />
      <pointLight position={[-7, -3, 5]} intensity={16} color="#f59e0b" />

      <Network count={count} animate={animate} />
      {animate ? <CameraParallax /> : null}

      {bloom ? (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.22}
            luminanceSmoothing={0.35}
            mipmapBlur
            radius={0.62}
          />
          <Vignette offset={0.32} darkness={0.62} eskil={false} />
        </EffectComposer>
      ) : null}

      <fog attach="fog" args={["#08080c", 14, 30]} />
    </Canvas>
  );
}
