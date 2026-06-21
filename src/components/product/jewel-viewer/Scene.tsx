'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Center,
  useGLTF,
  ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Metal } from '@/types/common';

const METAL_COLORS: Record<Metal, string> = {
  platinum: '#e5e4e2',
  'white-gold': '#ece9e4',
  'yellow-gold': '#e8c468',
  'rose-gold': '#e0a899',
};

/** A round-brilliant geometry: table + crown + girdle + pavilion to a culet. */
function useBrilliantGeometry(facets = 16) {
  return useMemo(() => {
    const crown = new THREE.CylinderGeometry(0.55, 1, 0.34, facets, 1);
    crown.translate(0, 0.2, 0);
    const girdle = new THREE.CylinderGeometry(1, 1, 0.06, facets, 1);
    const pavilion = new THREE.ConeGeometry(1, 0.95, facets, 1);
    pavilion.rotateX(Math.PI);
    pavilion.translate(0, -0.505, 0);
    const merged = mergeGeometries([crown, girdle, pavilion], false);
    merged.computeVertexNormals();
    return merged;
  }, [facets]);
}

interface DiamondProps {
  metal: Metal;
  showBand?: boolean;
}

/** Procedural brilliant-cut diamond — used until a real .glb asset exists. */
function PlaceholderDiamond({ metal, showBand = true }: DiamondProps) {
  const geometry = useBrilliantGeometry();

  return (
    <group rotation={[0.18, 0, 0]} scale={1.05}>
      <mesh geometry={geometry} position={[0, 0.55, 0]}>
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0}
          roughness={0}
          transmission={1}
          thickness={1.6}
          ior={2.42}
          dispersion={3}
          specularIntensity={1}
          envMapIntensity={2.2}
          clearcoat={1}
          clearcoatRoughness={0}
          flatShading
        />
      </mesh>

      {showBand && (
        <group>
          <mesh position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.92, 0.07, 24, 64]} />
            <meshStandardMaterial
              color={METAL_COLORS[metal]}
              metalness={1}
              roughness={0.18}
              envMapIntensity={1.4}
            />
          </mesh>
          {/* Four claws cradling the stone */}
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.55, 0.05, Math.sin(a) * 0.55]}
              >
                <cylinderGeometry args={[0.045, 0.06, 0.55, 12]} />
                <meshStandardMaterial
                  color={METAL_COLORS[metal]}
                  metalness={1}
                  roughness={0.18}
                  envMapIntensity={1.4}
                />
              </mesh>
            );
          })}
        </group>
      )}
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
  showBand?: boolean;
}

export default function Scene({
  modelSrc,
  metal,
  autoRotate = true,
  showBand = true,
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 4.4], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 4]} intensity={1.4} />
      <directionalLight position={[-5, 2, -3]} intensity={0.5} />
      <spotLight
        position={[0, 6, 2]}
        angle={0.5}
        penumbra={1}
        intensity={1.6}
        color="#fff6e6"
      />
      <Center>
        {modelSrc ? (
          <LoadedModel src={modelSrc} />
        ) : (
          <PlaceholderDiamond metal={metal} showBand={showBand} />
        )}
      </Center>
      <Environment preset="dawn" environmentIntensity={1.1} />
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.22}
        scale={7}
        blur={2.8}
        far={3}
      />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={2.8}
        maxDistance={7}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 4}
      />
    </Canvas>
  );
}
