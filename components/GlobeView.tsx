
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const Mesh = 'mesh' as any;
const SphereGeometry = 'sphereGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const RingGeometry = 'ringGeometry' as any;
const Group = 'group' as any;
const LineSegments = 'lineSegments' as any;
const LineBasicMaterial = 'lineBasicMaterial' as any;

const GLOBE_RADIUS = 2;

// Continent-specific neon color mapping
const CONTINENT_COLORS: Record<string, THREE.Color> = {
  'Africa': new THREE.Color('#ff8800'),        // Orange Neon
  'Asia': new THREE.Color('#00f2ff'),          // Cyan Neon
  'Europe': new THREE.Color('#00ff00'),        // Lime Neon
  'North America': new THREE.Color('#ff00ff'), // Magenta Neon
  'South America': new THREE.Color('#ffff00'), // Yellow Neon
  'Oceania': new THREE.Color('#ff0088'),       // Pink Neon
  'Antarctica': new THREE.Color('#ffffff'),    // White Neon
};

const DEFAULT_COLOR = new THREE.Color('#444444');

// Utility to convert Lat/Lng to 3D Space
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

const CountryOutlines = () => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
      .then((res) => res.json())
      .then((data) => {
        const points: THREE.Vector3[] = [];
        const colors: number[] = [];

        data.features.forEach((feature: any) => {
          const { geometry: geo, properties } = feature;
          const type = geo.type;
          const coords = geo.coordinates;
          
          // Get continent name from properties and select color
          const continent = properties.CONTINENT || properties.continent || 'Unknown';
          const continentColor = CONTINENT_COLORS[continent] || DEFAULT_COLOR;

          const addLines = (polygon: [number, number][]) => {
            // 1. Add Outlines
            for (let i = 0; i < polygon.length - 1; i++) {
              const p1 = latLngToVector3(polygon[i][1], polygon[i][0], GLOBE_RADIUS + 0.02);
              const p2 = latLngToVector3(polygon[i + 1][1], polygon[i + 1][0], GLOBE_RADIUS + 0.02);
              points.push(p1, p2);
              colors.push(continentColor.r, continentColor.g, continentColor.b, continentColor.r, continentColor.g, continentColor.b);
            }

            // 2. Add Inner Grid (Latitudinal scanlines)
            let minX = 180, maxX = -180, minY = 90, maxY = -90;
            polygon.forEach(([lng, lat]) => {
              if (lng < minX) minX = lng; if (lng > maxX) maxX = lng;
              if (lat < minY) minY = lat; if (lat > maxY) maxY = lat;
            });

            const gridStep = 2.0; 
            for (let lat = Math.ceil(minY / gridStep) * gridStep; lat <= maxY; lat += gridStep) {
              const intersections: number[] = [];
              for (let i = 0; i < polygon.length - 1; i++) {
                const [lng1, lat1] = polygon[i];
                const [lng2, lat2] = polygon[i + 1];
                if ((lat1 <= lat && lat2 > lat) || (lat2 <= lat && lat1 > lat)) {
                  const lng = lng1 + (lat - lat1) * (lng2 - lng1) / (lat2 - lat1);
                  intersections.push(lng);
                }
              }
              intersections.sort((a, b) => a - b);
              for (let i = 0; i < intersections.length; i += 2) {
                if (intersections[i+1] !== undefined) {
                  const p1 = latLngToVector3(lat, intersections[i], GLOBE_RADIUS + 0.01);
                  const p2 = latLngToVector3(lat, intersections[i+1], GLOBE_RADIUS + 0.01);
                  points.push(p1, p2);
                  // Inner grid is dimmer (30% intensity)
                  colors.push(continentColor.r * 0.3, continentColor.g * 0.3, continentColor.b * 0.3, continentColor.r * 0.3, continentColor.g * 0.3, continentColor.b * 0.3);
                }
              }
            }
          };

          if (type === 'Polygon') {
            coords.forEach((polygon: any) => addLines(polygon));
          } else if (type === 'MultiPolygon') {
            coords.forEach((multiPolygon: any) => {
              multiPolygon.forEach((polygon: any) => addLines(polygon));
            });
          }
        });

        const bufferGeo = new THREE.BufferGeometry().setFromPoints(points);
        bufferGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        setGeometry(bufferGeo);
      })
      .catch((err) => console.error('Globe GeoJSON error:', err));
  }, []);

  if (!geometry) return null;

  return (
    <LineSegments geometry={geometry}>
      <LineBasicMaterial 
        vertexColors 
        transparent 
        opacity={0.8} 
        linewidth={1} 
        blending={THREE.AdditiveBlending}
      />
    </LineSegments>
  );
};

const CyberGlobe = ({ active, introFinished }: { active: boolean; introFinished: boolean }) => {
  const mainRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const introDuration = 3.0;
    const isIntro = t < introDuration;
    const introFactor = isIntro ? Math.pow(1 - t / introDuration, 2) : 0; 
    
    if (groupRef.current) {
      if (isIntro) {
        groupRef.current.rotation.y += introFactor * 0.5;
        groupRef.current.rotation.x = Math.sin(t * 10) * introFactor * 0.2;
        groupRef.current.rotation.z = Math.cos(t * 8) * introFactor * 0.1;
      } else {
        const speedMultiplier = active ? 0.15 : 0.8;
        groupRef.current.rotation.y += 0.002 * speedMultiplier;
        groupRef.current.rotation.x *= 0.95;
        groupRef.current.rotation.z *= 0.95;
      }
    }

    const pulse = (Math.sin(t * 2) + 1) / 2;
    if (mainRef.current) {
      const mat = mainRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (isIntro ? 5 * introFactor : 1.2) + pulse * 1.5;
    }

    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2;
      ringRef.current.rotation.z = t * (isIntro ? 2 : 0.2);
    }

    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.05 + pulse * 0.015);
    }
  });

  return (
    <Group ref={groupRef}>
      <AmbientLight intensity={0.2} />
      <PointLight position={[10, 5, 10]} intensity={6} color="#00ffff" />
      <PointLight position={[-10, -5, -10]} intensity={4} color="#ff00ff" />
      
      {/* Core Body */}
      <Mesh raycast={null}>
        <SphereGeometry args={[GLOBE_RADIUS - 0.1, 64, 64]} />
        <MeshStandardMaterial color="#010208" roughness={0.2} metalness={0.9} />
      </Mesh>

      {/* Grid Overlay Shell */}
      <Mesh ref={mainRef} raycast={null}>
        <SphereGeometry args={[GLOBE_RADIUS, 45, 45]} />
        <MeshStandardMaterial
          color="#000000"
          emissive="#22d3ee"
          emissiveIntensity={1}
          wireframe
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </Mesh>

      {/* Country Outlines and Inner Grids */}
      <CountryOutlines />

      {/* Atmospheric Glow */}
      <Mesh ref={glowRef} raycast={null}>
        <SphereGeometry args={[GLOBE_RADIUS + 0.15, 64, 64]} />
        <MeshStandardMaterial
          color="#0066ff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Mesh>

      {/* Data Ring */}
      <Mesh ref={ringRef} raycast={null}>
        <RingGeometry args={[GLOBE_RADIUS + 0.4, GLOBE_RADIUS + 0.42, 128]} />
        <MeshStandardMaterial
          color="#00f2ff"
          emissive="#00f2ff"
          emissiveIntensity={8}
          side={THREE.DoubleSide}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </Mesh>
    </Group>
  );
};

const IntroCamera = ({ active, onIntroEnd }: { active: boolean, onIntroEnd: () => void }) => {
  const { camera } = useThree();
  const introFinished = useRef(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (t < 3.0) {
      const targetZ = active ? 5.8 : 8.5;
      const startZ = 20;
      const progress = Math.min(t / 3.0, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      camera.position.z = startZ + (targetZ - startZ) * ease;
    } else if (!introFinished.current) {
      introFinished.current = true;
      onIntroEnd();
    }
  });

  return null;
};

const GlobeView: React.FC<{ active: boolean; selectedPos: { lat: number; lng: number } | null }> = ({ active, selectedPos }) => {
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none">
      <Canvas 
        dpr={[1, 2]} 
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true }} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={40} />
        <IntroCamera active={active} onIntroEnd={() => setIntroDone(true)} />
        <Stars radius={250} depth={120} count={5000} factor={4} saturation={1} fade speed={1.2} />
        <CyberGlobe active={active} introFinished={introDone} />
        <OrbitControls 
          enablePan={false}
          enableZoom={active}
          minDistance={3.8}
          maxDistance={12}
          rotateSpeed={1.2}
          enableDamping={true}
          dampingFactor={0.04}
          autoRotate={introDone && !active && !selectedPos}
          autoRotateSpeed={2.5}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
};

export default GlobeView;
