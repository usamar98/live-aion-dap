import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Floating particles representing network nodes
function NetworkParticles({ count = 1000 }) {
  const mesh = useRef();
  const light = useRef();
  
  // Generate random positions for particles
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 20;
      temp[i * 3 + 1] = (Math.random() - 0.5) * 20;
      temp[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (mesh.current) {
      mesh.current.rotation.x = time * 0.1;
      mesh.current.rotation.y = time * 0.05;
    }
    if (light.current) {
      light.current.position.x = Math.sin(time * 0.5) * 5;
      light.current.position.z = Math.cos(time * 0.5) * 5;
    }
  });

  return (
    <group>
      <Points ref={mesh} positions={particles} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#666666"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
      <pointLight ref={light} distance={40} intensity={0.3} color="#888888" />
    </group>
  );
}

// Rotating geometric shapes representing security shields
function SecurityShields() {
  const group = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = time * 0.1;
    }
  });

  return (
    <group ref={group}>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 8;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(i * 0.5) * 2,
              Math.sin(angle) * radius
            ]}
            rotation={[0, angle, 0]}
          >
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#444444" : "#666666"}
              transparent
              opacity={0.7}
              wireframe={i % 3 === 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Floating cubes representing data blocks/blockchain
function DataBlocks() {
  const group = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.x = time * 0.05;
      group.current.rotation.z = time * 0.03;
    }
  });

  return (
    <group ref={group}>
      {[...Array(12)].map((_, i) => {
        const x = (Math.random() - 0.5) * 15;
        const y = (Math.random() - 0.5) * 15;
        const z = (Math.random() - 0.5) * 15;
        return (
          <mesh key={i} position={[x, y, z]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial
              color="#333333"
              transparent
              opacity={0.5}
              wireframe
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Network connections/lines
function NetworkConnections() {
  const lines = useRef();
  
  const points = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 50; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      temp.push(start, end);
    }
    return temp;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (lines.current) {
      lines.current.rotation.y = time * 0.02;
    }
  });

  return (
    <group ref={lines}>
      {points.map((point, i) => {
        if (i % 2 === 0 && points[i + 1]) {
          return (
            <line key={i}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    point.x, point.y, point.z,
                    points[i + 1].x, points[i + 1].y, points[i + 1].z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#555555" transparent opacity={0.3} />
            </line>
          );
        }
        return null;
      })}
    </group>
  );
}

// Main 3D Scene
function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} color="#666666" />
      <directionalLight position={[10, 10, 5]} intensity={0.3} color="#888888" />
      <NetworkParticles count={800} />
      <SecurityShields />
      <DataBlocks />
      <NetworkConnections />
    </>
  );
}

// Main component
const ThreeBackground = () => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)' }}
      >
        <Scene />
      </Canvas>
      {/* Additional overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/20 via-transparent to-gray-900/20 z-10"></div>
    </div>
  );
};

export default ThreeBackground;