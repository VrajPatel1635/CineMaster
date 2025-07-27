'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const Cylinder = ({ color }) => {
  const ref = useRef();

  useFrame(() => {
    ref.current.rotation.x += 0.002;
    ref.current.rotation.y += 0.004;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh ref={ref} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 2, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>
    </Float>
  );
};

const CylinderScene = () => {
  const cylinders = Array.from({ length: 4 }, (_, i) => ({
    position: [Math.cos(i * Math.PI / 2) * 3, 0, Math.sin(i * Math.PI / 2) * 3],
    color: ['#6366F1', '#EC4899', '#22D3EE', '#FBBF24'][i],
  }));

  return (
    <div className="h-[400px] w-full">
      <Canvas
        shadows
        camera={{ position: [0, 3, 7], fov: 50 }}
        style={{ borderRadius: '1rem' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Environment preset="city" />

        <group>
          {cylinders.map((cyl, index) => (
            <Cylinder key={index} color={cyl.color} position={cyl.position} />
          ))}
        </group>

        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  );
};

export default CylinderScene;
