import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { DestinationWaypoint, DestinationStoryChapter } from '../../../data/destinations/types';

interface HimachalSceneProps {
  waypoints: DestinationWaypoint[];
  activeChapterIndex?: number;
  onSelectWaypoint?: (wp: DestinationWaypoint) => void;
  className?: string;
}

function AlpineValleyTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(36, 36, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();
    const cols: number[] = [];

    const valleyGreen = new THREE.Color('#064e3b'); // Cedar pine deep green
    const mossColor = new THREE.Color('#047857'); // Riverbank moss
    const rockColor = new THREE.Color('#334155'); // Wet granite
    const passSnow = new THREE.Color('#cbd5e1'); // High Jalori ridge
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);

      // Deep V-shaped river valley running along Z axis
      const valleyTrough = Math.pow(vertex.x * 0.35, 2) * 1.8;
      const mountainRise = Math.cos(vertex.z * 0.25) * Math.sin(vertex.x * 0.2) * 2.5;
      const passElevation = Math.exp(-Math.pow(vertex.z + 6, 2) * 0.08) * 3.8;

      const y = Math.max(0, valleyTrough + mountainRise + passElevation);
      pos.setY(i, y);

      const normY = THREE.MathUtils.clamp(y / 8, 0, 1);
      if (normY < 0.25) {
        color.copy(mossColor).lerp(valleyGreen, normY / 0.25);
      } else if (normY < 0.65) {
        color.copy(valleyGreen).lerp(rockColor, (normY - 0.25) / 0.4);
      } else {
        color.copy(rockColor).lerp(passSnow, (normY - 0.65) / 0.35);
      }
      cols.push(color.r, color.g, color.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    return { geometry: geo, colors: cols };
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.8} metalness={0.1} flatShading />
    </mesh>
  );
}

function FlowingAlpineStream() {
  const streamRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (streamRef.current) {
      streamRef.current.position.y = 0.25 + Math.sin(clock.getElapsedTime() * 1.5) * 0.02;
    }
  });

  return (
    <mesh ref={streamRef} position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.5, 36, 32, 32]} />
      <meshStandardMaterial
        color="#059669"
        emissive="#047857"
        emissiveIntensity={0.5}
        roughness={0.1}
        metalness={0.8}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function PineForestSilhouettes() {
  const instances = useMemo(() => {
    const count = 75;
    const items = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 28;
      const z = (Math.random() - 0.5) * 28;
      if (Math.abs(x) > 1.8) {
        // Outside river channel
        const y = Math.pow(x * 0.35, 2) * 1.5;
        items.push({ pos: [x, y + 0.6, z], scale: Math.random() * 0.4 + 0.6 });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {instances.map((item, i) => (
        <group key={i} position={item.pos as [number, number, number]} scale={item.scale}>
          <mesh position={[0, 0.6, 0]}>
            <coneGeometry args={[0.4, 1.4, 5]} />
            <meshStandardMaterial color="#022c22" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.3, 4]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AlpineMist() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions } = useMemo(() => {
    const count = 350;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 1] = Math.random() * 6 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 32;
    }
    return { positions: pos };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] += delta * 0.4;
        if (arr[i] > 16) arr[i] = -16;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a7f3d0"
        size={0.45}
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </points>
  );
}

function AlpineCameraController({ chapters, activeIndex }: { chapters: DestinationStoryChapter[]; activeIndex: number }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const ch = chapters[activeIndex] || chapters[0];
    if (ch) {
      pos.set(...ch.cameraPosition);
      target.set(...ch.cameraTarget);
      camera.position.lerp(pos, 0.035);
      camera.lookAt(target);
    }
  });

  return null;
}

export default function HimachalAlpineScene({
  waypoints,
  activeChapterIndex = 0,
  onSelectWaypoint,
  className = '',
}: HimachalSceneProps) {
  const chapters: DestinationStoryChapter[] = useMemo(() => [
    { id: '1', number: '01', title: 'Tirthan', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [-8.5, 3.8, 9], cameraTarget: [-7, 0.5, 6] },
    { id: '2', number: '02', title: 'Choie', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [-6, 4.5, 6], cameraTarget: [-4.5, 1.4, 3] },
    { id: '3', number: '03', title: 'Jibhi', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [-2.5, 5.0, 3.5], cameraTarget: [-1, 2.2, 0.5] },
    { id: '4', number: '04', title: 'Jalori', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [2, 6.5, 0], cameraTarget: [3.5, 4.2, -2.5] },
    { id: '5', number: '05', title: 'Sharchi', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [0, 5.2, 8], cameraTarget: [1.5, 2.6, 5] },
    { id: '6', number: '06', title: 'Return', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [-7, 4.0, 8.5], cameraTarget: [-7, 0.5, 6] },
  ], []);

  return (
    <div className={`relative w-full h-full min-h-[500px] overflow-hidden ${className}`}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        className="w-full h-full block"
      >
        <PerspectiveCamera makeDefault position={[-8.5, 3.8, 9]} fov={45} />
        <AlpineCameraController chapters={chapters} activeIndex={activeChapterIndex} />

        {/* Warm Alpine Mountain Morning Atmosphere */}
        <color attach="background" args={['#061a14']} />
        <fogExp2 attach="fog" args={['#061a14', 0.028]} />

        <ambientLight intensity={0.6} color="#6ee7b7" />
        <directionalLight position={[25, 40, 20]} intensity={1.4} color="#fef3c7" castShadow />
        <directionalLight position={[-20, 15, -15]} intensity={0.5} color="#047857" />

        {/* Forest, Valley & Mist */}
        <AlpineValleyTerrain />
        <FlowingAlpineStream />
        <PineForestSilhouettes />
        <AlpineMist />

        {/* Wooden Chalet Waypoint Markers */}
        {waypoints.map((wp) => (
          <group
            key={wp.id}
            position={[wp.coordinates[0], wp.coordinates[1] + 0.35, wp.coordinates[2]]}
            onClick={() => onSelectWaypoint?.(wp)}
          >
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.32, 0.32, 0.32]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#059669"
                emissiveIntensity={0.8}
                roughness={0.3}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.2, 0.32, 16]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </Canvas>

      {/* Subtle Bottom Controls Hint */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-[11px] font-mono text-emerald-300/70 tracking-wider flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-emerald-500/20 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Alpine 3D Pine Valley
      </div>
    </div>
  );
}
