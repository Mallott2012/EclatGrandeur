'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Center,
  useGLTF,
  ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import type { Metal } from '@/types/common';

const METAL_COLORS: Record<Metal, string> = {
  platinum: '#e5e4e2',
  'white-gold': '#ece9e4',
  'yellow-gold': '#e8c468',
  'rose-gold': '#e0a899',
};

/** Procedural faceted diamond — used when no .glb asset exists yet. */
function PlaceholderDiamond({ metal }: { metal: Metal }) {
  return (
    <group rotation={[0.3, 0, 0]}>
      {/* Crown + pavilion as two cones forming a brilliant silhouette */}
      <mesh position={[0, 0.35, 0]}>
        <coneGeometry args={[1, 0.7, 8]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0}
          roughness={0}
          transmission={0.92}
          thickness={1.4}
          ior={2.4}
          reflectivity={1}
        />
      </mesh>
      <mesh position={[0, -0.45, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1, 1.2, 8]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0}
          roughness={0}
          transmission={0.92}
          thickness={1.4}
          ior={2.4}
          reflectivity={1}
        />
      </mesh>
      {/* Suggestion of a band to read the chosen metal */}
      <mesh position={[0, -0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.08, 16, 48]} />
        <meshStandardMaterial
          color={METAL_COLORS[metal]}
          metalness={1}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

function LoadedModel({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene as THREE.Object3D} />;
}

interface SceneProps {
  modelSrc?: string;
  metal: Metal;
  autoRotate?: boolean;
}

export default function Scene({ modelSrc, metal, autoRotate = true }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, 2, -3]} intensity={0.6} />
      <Suspense fallback={null}>
        <Center>
          {modelSrc ? (
            <LoadedModel src={modelSrc} />
          ) : (
            <PlaceholderDiamond metal={metal} />
          )}
        </Center>
        <Environment preset="studio" />
      </Suspense>
      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.25}
        scale={6}
        blur={2.5}
        far={3}
      />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={2.5}
        maxDistance={7}
        autoRotate={autoRotate}
        autoRotateSpeed={1.1}
      />
    </Canvas>
  );
}
