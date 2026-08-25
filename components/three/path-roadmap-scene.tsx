"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Sphere } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

import { LEVEL_RANK, LEVEL_STYLES, stageAnchorId } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/types";

/**
 * The per-path roadmap graph.
 *
 * Stages sit on a Catmull-Rom S-curve through 3D space so the sequence reads
 * as a journey rather than a table row. Every node carries a permanent label —
 * this is a reference diagram, so the information has to be readable without
 * interaction; hover only emphasises.
 */

const X_SPAN = 7.2;
/** Label box width in px. Alternating sides gives each label twice the
 *  node spacing, so this only has to clear 2x the gap, not 1x. */
const LABEL_W = 96;

type Placed = {
  stage: Stage;
  index: number;
  position: THREE.Vector3;
  color: THREE.Color;
  scale: number;
  emissive: number;
  /** Strict index parity, not curve position — see place(). */
  above: boolean;
};

function place(stages: Stage[]): Placed[] {
  const last = Math.max(stages.length - 1, 1);

  return stages.map((stage, i) => {
    const t = i / last;
    const rank = LEVEL_RANK[stage.level];

    const x = THREE.MathUtils.lerp(-X_SPAN, X_SPAN, t);
    // Gentler wave than before. The curve has to stay clear of two rows of
    // labels, so amplitude buys shape at the cost of vertical headroom.
    const y = Math.sin(t * Math.PI * 2) * 0.44;
    const z = Math.cos(t * Math.PI * 1.15) * 0.85;

    return {
      stage,
      index: i,
      position: new THREE.Vector3(x, y, z),
      color: new THREE.Color(LEVEL_STYLES[stage.level].hex),
      // Size carries level rank.
      scale: 0.15 + rank * 0.058,
      // Brightness carries it too, but as a premultiplier on the colour that
      // can never exceed 1.0. Driving emissiveIntensity above 1 instead pushes
      // the brightest channel of each hue to clip, which turns every
      // high-level node white and destroys the colour coding.
      emissive: 0.75 + rank * 0.08,
      // Alternate strictly by index. Keying this off the curve (y >= 0) put
      // every consecutive node on the same side, which is what collided:
      // ten labels competing for one row instead of five in each.
      above: i % 2 === 0,
    };
  });
}

function NodeLabel({ node, active }: { node: Placed; active: boolean }) {
  const style = LEVEL_STYLES[node.stage.level];
  // Constant offset from the node plus its own y, so both label rows land on
  // a flat line regardless of where the curve happens to be.
  const offset = 1.3 - (node.above ? node.position.y : -node.position.y);

  return (
    <Html
      center
      position={[0, node.above ? offset : -offset, 0]}
      zIndexRange={[30, 0]}
      // Labels never intercept the pointer; the node itself owns interaction,
      // otherwise a label would block the node behind it.
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{ width: LABEL_W }}
        className={cn(
          "select-none text-center transition-opacity duration-200",
          node.above ? "-translate-y-full pb-1" : "translate-y-0 pt-1",
          active ? "opacity-100" : "opacity-85",
        )}
      >
        <p
          className="font-mono text-[9px] leading-none"
          style={{ color: style.hex }}
        >
          {String(node.index + 1).padStart(2, "0")} · {style.label}
        </p>
        <p
          className={cn(
            "mt-1 line-clamp-2 text-[10px] font-medium leading-tight transition-colors",
            active ? "text-foreground" : "text-foreground/80",
          )}
          title={node.stage.title}
        >
          {node.stage.title}
        </p>
        {node.stage.resources.length > 0 ? (
          <p className="mt-0.5 text-[9px] leading-none text-muted-foreground">
            {node.stage.resources.length} resources
          </p>
        ) : node.stage.needsOriginalContent ? (
          <p className="mt-0.5 text-[9px] leading-none text-amber-400/80">
            to write
          </p>
        ) : null}
      </div>
    </Html>
  );
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
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const idle =
      1 + Math.sin(state.clock.elapsedTime * 1.5 + node.position.x) * 0.028;
    const target = node.scale * (active ? 1.34 : idle);

    if (core.current) {
      core.current.scale.lerp(new THREE.Vector3(target, target, target), 0.18);
    }
    if (ring.current) {
      const r = target * (active ? 2.5 : 2.1);
      ring.current.scale.lerp(new THREE.Vector3(r, r, r), 0.18);
      ring.current.lookAt(state.camera.position);
    }
  });

  return (
    <group position={node.position}>
      {/* Halo, so level colour is still legible where the core is small. */}
      <mesh ref={ring} scale={node.scale * 2.1}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={active ? 0.3 : 0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Sphere ref={core} args={[1, 24, 24]} scale={node.scale}>
        <meshBasicMaterial
          color={node.color
            .clone()
            .multiplyScalar(active ? Math.min(node.emissive * 1.25, 1) : node.emissive)}
          toneMapped={false}
        />
      </Sphere>

      {/* Invisible, generously sized hit target — the visible core is far too
          small to hover comfortably. */}
      <mesh
        visible={false}
        scale={Math.max(node.scale * 3.4, 0.44)}
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
        <sphereGeometry args={[1, 8, 8]} />
      </mesh>

      <NodeLabel node={node} active={active} />
    </group>
  );
}

function Roadmap({ stages }: { stages: Stage[] }) {
  const group = useRef<THREE.Group>(null);
  const [active, setActive] = useState<number | null>(null);
  const { gl } = useThree();

  const nodes = useMemo(() => place(stages), [stages]);

  /** Curve sampled by hand so each point can take the colour of the segment
   *  it falls in — the connector then shifts hue as the levels progress. */
  const { points, colors } = useMemo(() => {
    const spline = new THREE.CatmullRomCurve3(nodes.map((n) => n.position));
    const steps = Math.max(nodes.length * 18, 80);
    const points: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    const lastIndex = nodes.length - 1;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push(spline.getPoint(t));

      const scaled = t * lastIndex;
      const from = Math.min(Math.floor(scaled), lastIndex);
      const to = Math.min(from + 1, lastIndex);
      colors.push(
        nodes[from].color.clone().lerp(nodes[to].color, scaled - from),
      );
    }

    return { points, colors };
  }, [nodes]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Slight lean toward the pointer. Not orbit controls — this is an
    // overview and must not be draggable.
    const targetY = state.pointer.x * 0.13;
    const targetX = -state.pointer.y * 0.08;
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
      <Line
        points={points}
        vertexColors={colors}
        lineWidth={1.6}
        transparent
        opacity={0.55}
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
      camera={{ position: [0, 0, 10.4], fov: 42 }}
      gl={{
        antialias: !bloom,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: "transparent" }}
    >
      {/* No lights: every material here is unlit, so hue is exactly the
          level colour and cannot be shifted by lighting. */}
      <Roadmap stages={stages} />

      {bloom ? (
        // Threshold sits above the node emissive so bloom halos the cores
        // without washing the labels sitting next to them.
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.42}
            luminanceThreshold={0.34}
            luminanceSmoothing={0.45}
            mipmapBlur
            radius={0.45}
          />
        </EffectComposer>
      ) : null}
    </Canvas>
  );
}
