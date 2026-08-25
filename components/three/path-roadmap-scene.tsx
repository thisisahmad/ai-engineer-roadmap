"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Sphere } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

import { LEVEL_RANK, LEVEL_STYLES, stageAnchorId } from "@/lib/levels";
import type { Stage } from "@/lib/types";

/**
 * The per-path roadmap graph.
 *
 * Stages are laid out along a gentle S-curve through 3D space rather than a
 * straight line, so the sequence reads as a journey instead of a table row.
 * Node size and glow follow level rank, and colour comes from the shared
 * LEVEL_STYLES map so the graph and the stage cards below always agree.
 */

const X_SPAN = 6.4;

type Placed = {
  stage: Stage;
  position: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  emissive: number;
};

function place(stages: Stage[]): Placed[] {
  const last = Math.max(stages.length - 1, 1);

  return stages.map((stage, i) => {
    const t = i / last;
    const rank = LEVEL_RANK[stage.level];

    // S-curve: one full sine period across y, a slower cosine sweep in z so
    // the path leans toward and away from the camera as it advances.
    const x = THREE.MathUtils.lerp(-X_SPAN, X_SPAN, t);
    const y = Math.sin(t * Math.PI * 2) * 0.92;
    const z = Math.cos(t * Math.PI * 1.15) * 1.35;

    return {
      stage,
      position: new THREE.Vector3(x, y, z),
      color: new THREE.Color(LEVEL_STYLES[stage.level].hex),
      scale: 0.17 + rank * 0.052,
      emissive: 1.35 + rank * 0.72,
    };
  });
}

function Node({
  node,
  active,
  onEnter,
  onLeave,
  onSelect,
}: {
  node: Placed;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    // Hovered node swells slightly; the rest breathe just enough to look live.
    const idle = 1 + Math.sin(state.clock.elapsedTime * 1.6 + node.position.x) * 0.03;
    const target = node.scale * (active ? 1.42 : idle);
    mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.18);
  });

  const style = LEVEL_STYLES[node.stage.level];

  return (
    <group position={node.position}>
      <Sphere
        ref={mesh}
        args={[1, 24, 24]}
        scale={node.scale}
        onPointerOver={(e) => {
          e.stopPropagation();
          onEnter();
        }}
        onPointerOut={onLeave}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={active ? node.emissive * 1.7 : node.emissive}
          roughness={0.28}
          metalness={0.1}
          toneMapped={false}
        />
      </Sphere>

      {active ? (
        <Html
          center
          // Lifted clear of the node so the label never sits on the glow.
          position={[0, node.scale * 2.6, 0]}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="w-max max-w-[15rem] -translate-y-1 rounded-lg border border-border/80 bg-background/95 px-2.5 py-1.5 text-center shadow-xl backdrop-blur-sm">
            <p className="text-xs font-medium leading-tight">
              {node.stage.title}
            </p>
            <p className={`mt-0.5 text-[10px] ${style.badge.split(" ")[1]}`}>
              {node.stage.levelLabel}
            </p>
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function Roadmap({ stages }: { stages: Stage[] }) {
  const group = useRef<THREE.Group>(null);
  const [active, setActive] = useState<number | null>(null);
  const { gl } = useThree();

  const nodes = useMemo(() => place(stages), [stages]);

  /** Smooth curve through every node, sampled densely enough to look drawn
   *  rather than segmented. */
  const curve = useMemo(() => {
    const spline = new THREE.CatmullRomCurve3(nodes.map((n) => n.position));
    return spline.getPoints(Math.max(nodes.length * 14, 60));
  }, [nodes]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Slight pointer lean. Not orbit controls — this is an overview, and it
    // should not be draggable.
    const targetY = state.pointer.x * 0.16;
    const targetX = -state.pointer.y * 0.1;
    const damp = 1 - Math.pow(0.0022, delta);
    group.current.rotation.y += (targetY - group.current.rotation.y) * damp;
    group.current.rotation.x += (targetX - group.current.rotation.x) * damp;
  });

  const select = (stage: Stage) => {
    const target = document.getElementById(stageAnchorId(stage.id));
    if (!target) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <group ref={group}>
      {/* Connector. Rendered under the nodes so it reads as the path they sit
          on rather than a line drawn over them. */}
      <Line
        points={curve}
        color="#6b7280"
        lineWidth={1.4}
        transparent
        opacity={0.5}
        toneMapped={false}
      />

      {nodes.map((node, i) => (
        <Node
          key={node.stage.id}
          node={node}
          active={active === i}
          onEnter={() => {
            setActive(i);
            gl.domElement.style.cursor = "pointer";
          }}
          onLeave={() => {
            setActive((current) => (current === i ? null : current));
            gl.domElement.style.cursor = "auto";
          }}
          onSelect={() => select(node.stage)}
        />
      ))}
    </group>
  );
}

export default function PathRoadmapScene({
  stages,
  bloom = true,
}: {
  stages: Stage[];
  bloom?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0.4, 9.6], fov: 42 }}
      gl={{
        antialias: !bloom,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <pointLight position={[0, 3, 7]} intensity={22} color="#ffffff" />

      <Roadmap stages={stages} />

      {bloom ? (
        // Lighter than the hero: smaller canvas, and the labels must stay
        // readable against it.
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.4}
            mipmapBlur
            radius={0.5}
          />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
