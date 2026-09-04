import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { DestinationWaypoint, DestinationStoryChapter } from '../../../data/destinations/types';

interface LadakhSceneProps {
  waypoints: DestinationWaypoint[];
  activeChapterIndex?: number;
  onSelectWaypoint?: (wp: DestinationWaypoint) => void;
  className?: string;
}

function HighAltitudePlateau() {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(36, 36, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();
    const cols: number[] = [];

    const sandColor = new THREE.Color('#334155'); // Deep slate sand
    const mountainColor = new THREE.Color('#1e293b'); // High arid rock
    const snowColor = new THREE.Color('#93c5fd'); // Cold high altitude snow peak
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);

      // Jagged mountain ridges
      const dist = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
      const ridge = Math.sin(vertex.x * 0.35 + vertex.z * 0.25) * Math.cos(vertex.z * 0.4 - vertex.x * 0.2) * 3.2;
      const passElevation = Math.exp(-Math.pow(vertex.x - 2, 2) * 0.05) * 4.5;
      const edge = Math.pow(dist / 18, 2) * 4;

      const y = Math.max(-0.2, (ridge + passElevation + edge) * 0.8);
      pos.setY(i, y);

      const normY = THREE.MathUtils.clamp(y / 7, 0, 1);
      if (normY < 0.3) {
        color.copy(sandColor).lerp(mountainColor, normY / 0.3);
      } else {
        color.copy(mountainColor).lerp(snowColor, Math.pow((normY - 0.3) / 0.7, 1.5));
      }
      cols.push(color.r, color.g, color.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    return { geometry: geo, colors: cols };
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.9} metalness={0.2} flatShading />
    </mesh>
  );
}

function PangongLakeSurface() {
  const lakeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (lakeRef.current) {
      lakeRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.02;
    }
  });

  return (
    <mesh ref={lakeRef} position={[6.5, 0.4, -2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[3.8, 32]} />
      <meshStandardMaterial
        color="#0284c7"
        emissive="#0369a1"
        emissiveIntensity={0.6}
        roughness={0.1}
        metalness={0.9}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function ExpeditionRouteTrack({ waypoints }: { waypoints: DestinationWaypoint[] }) {
  const { lineGeometry, curve } = useMemo(() => {
    const pts = waypoints.map((w) => new THREE.Vector3(w.coordinates[0], w.coordinates[1] + 0.3, w.coordinates[2]));
    const crv = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const tube = new THREE.TubeGeometry(crv, 100, 0.08, 8, false);
    return { lineGeometry: tube, curve: crv };
  }, [waypoints]);

  return (
    <mesh geometry={lineGeometry}>
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#38bdf8"
        emissiveIntensity={0.9}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

function CelestialCameraController({ chapters, activeIndex }: { chapters: DestinationStoryChapter[]; activeIndex: number }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const ch = chapters[activeIndex] || chapters[0];
    if (ch) {
      pos.set(...ch.cameraPosition);
      target.set(...ch.cameraTarget);
      camera.position.lerp(pos, 0.04);
      camera.lookAt(target);
    }
  });

  return null;
}

export default function LadakhCelestialScene({
  waypoints,
  activeChapterIndex = 0,
  onSelectWaypoint,
  className = '',
}: LadakhSceneProps) {
  const chapters: DestinationStoryChapter[] = useMemo(() => [
    { id: '1', number: '01', title: 'Leh', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [-8, 4.5, 9], cameraTarget: [-6, 1.2, 5] },
    { id: '2', number: '02', title: 'Khardung La', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [-3, 6.5, 4], cameraTarget: [-1.5, 4.8, 0] },
    { id: '3', number: '03', title: 'Nubra', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [0, 4.2, -1], cameraTarget: [2, 1.5, -4] },
    { id: '4', number: '04', title: 'Pangong', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [4, 5.2, 1], cameraTarget: [6.5, 2.8, -2] },
    { id: '5', number: '05', title: 'Chang La', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [1, 6.0, 5], cameraTarget: [3, 4.4, 3] },
    { id: '6', number: '06', title: 'Hemis', subtitle: '', narrative: '', dayRange: '', altitudeInfo: '', highlight: '', cameraPosition: [-5, 3.8, 8], cameraTarget: [-3, 1.6, 6] },
  ], []);

  return (
    <div className={`relative w-full h-full min-h-[500px] overflow-hidden ${className}`}>
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        className="w-full h-full block"
      >
        <PerspectiveCamera makeDefault position={[-8, 4.5, 9]} fov={45} />
        <CelestialCameraController chapters={chapters} activeIndex={activeChapterIndex} />

        {/* Ambient Dark Night Environment */}
        <color attach="background" args={['#06090e']} />
        <fogExp2 attach="fog" args={['#06090e', 0.024]} />

        <ambientLight intensity={0.4} color="#38bdf8" />
        <directionalLight position={[20, 35, 15]} intensity={1.2} color="#e0f2fe" castShadow />
        <directionalLight position={[-15, 20, -15]} intensity={0.6} color="#1e40af" />

        {/* High-Altitude Starfield */}
        <Stars radius={40} depth={30} count={3500} factor={4} saturation={0.8} fade speed={1.2} />

        {/* Celestial Moon / Galactic Orb */}
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={[12, 18, -20]}>
            <sphereGeometry args={[1.8, 32, 32]} />
            <meshBasicMaterial color="#f0f9ff" />
          </mesh>
        </Float>

        {/* Topographic Terrain & Water Surface */}
        <HighAltitudePlateau />
        <PangongLakeSurface />
        <ExpeditionRouteTrack waypoints={waypoints} />

        {/* Floating Waypoint Beacons */}
        {waypoints.map((wp) => (
          <group
            key={wp.id}
            position={[wp.coordinates[0], wp.coordinates[1] + 0.35, wp.coordinates[2]]}
            onClick={() => onSelectWaypoint?.(wp)}
          >
            <mesh position={[0, 0.25, 0]}>
              <octahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={0.8}
                roughness={0.2}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.2, 0.3, 16]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </Canvas>

      {/* Subtle Bottom Controls Hint */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-[11px] font-mono text-cyan-300/60 tracking-wider flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-cyan-400/20 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        Celestial 3D Trans-Himalayas
      </div>
    </div>
  );
}
