import React, { useRef, useState, useFrame } from 'react';
import { useGLTF, Text, Box, Sphere, Cylinder, Plane } from '@react-three/drei';
import * as THREE from 'three';

// 3D Particle System
export const ParticleSystem3D = ({ count = 1000, theme = 'mystery' }) => {
  const meshRef = useRef();
  const particlesRef = useRef();

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      particlesRef.current.rotation.y = time * 0.1;
      particlesRef.current.rotation.x = time * 0.05;
      
      // Animate particles
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3 + 1] = Math.sin(time + positions[i3]) * 0.5;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const getThemeColors = () => {
    switch (theme) {
      case 'mystery':
        return ['#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4'];
      case 'scifi':
        return ['#00FFFF', '#FF00FF', '#00FF00', '#FFFF00'];
      case 'horror':
        return ['#FF0000', '#800000', '#FF4500', '#FF6347'];
      default:
        return ['#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4'];
    }
  };

  const colors = getThemeColors();

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3).map(() => (Math.random() - 0.5) * 20)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={new Float32Array(count * 3).map(() => {
            const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
            return [color.r, color.g, color.b];
          }).flat()}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// 3D Floating Letters
export const FloatingLetters3D = ({ letters, theme = 'mystery' }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        child.position.y = Math.sin(state.clock.elapsedTime + index) * 0.5;
        child.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.3;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {letters.map((letter, index) => (
        <Text
          key={index}
          position={[
            (index - letters.length / 2) * 2,
            Math.sin(index) * 2,
            Math.cos(index) * 2
          ]}
          fontSize={1}
          color={theme === 'mystery' ? '#4ECDC4' : theme === 'scifi' ? '#00FFFF' : '#FF0000'}
          anchorX="center"
          anchorY="middle"
          font="/fonts/helvetiker_regular.typeface.json"
        >
          {letter}
        </Text>
      ))}
    </group>
  );
};

// 3D Atmospheric Lighting
export const AtmosphericLighting3D = ({ theme = 'mystery' }) => {
  const lightRef = useRef();

  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.elapsedTime;
      lightRef.current.position.x = Math.sin(time * 0.5) * 5;
      lightRef.current.position.z = Math.cos(time * 0.5) * 5;
      lightRef.current.intensity = 0.5 + Math.sin(time * 2) * 0.2;
    }
  });

  const getThemeColor = () => {
    switch (theme) {
      case 'mystery':
        return '#4ECDC4';
      case 'scifi':
        return '#00FFFF';
      case 'horror':
        return '#FF0000';
      default:
        return '#4ECDC4';
    }
  };

  return (
    <pointLight
      ref={lightRef}
      position={[0, 5, 0]}
      intensity={0.5}
      color={getThemeColor()}
      distance={20}
      decay={2}
    />
  );
};

// 3D Interactive Books
export const Books3D = ({ count = 20, onBookClick }) => {
  const booksRef = useRef();

  useFrame((state) => {
    if (booksRef.current) {
      booksRef.current.children.forEach((book, index) => {
        book.rotation.y = Math.sin(state.clock.elapsedTime * 0.1 + index) * 0.1;
      });
    }
  });

  return (
    <group ref={booksRef}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          args={[0.2, 0.3, 0.05]}
          position={[
            -2 + (i % 5) * 0.5,
            -1 + Math.floor(i / 5) * 0.4,
            -9.5
          ]}
          onClick={() => onBookClick && onBookClick(i)}
          castShadow
        >
          <meshLambertMaterial 
            color={i % 3 === 0 ? '#8B0000' : i % 3 === 1 ? '#006400' : '#000080'} 
          />
        </Box>
      ))}
    </group>
  );
};

// 3D Crystal Shards
export const CrystalShards3D = ({ count = 50, theme = 'mystery' }) => {
  const shardsRef = useRef();

  useFrame((state) => {
    if (shardsRef.current) {
      shardsRef.current.children.forEach((shard, index) => {
        shard.rotation.x = Math.sin(state.clock.elapsedTime + index) * 0.5;
        shard.rotation.y = Math.cos(state.clock.elapsedTime * 0.5 + index) * 0.3;
        shard.position.y = Math.sin(state.clock.elapsedTime * 2 + index) * 0.2;
      });
    }
  });

  const getThemeColor = () => {
    switch (theme) {
      case 'mystery':
        return '#4ECDC4';
      case 'scifi':
        return '#00FFFF';
      case 'horror':
        return '#FF0000';
      default:
        return '#4ECDC4';
    }
  };

  return (
    <group ref={shardsRef}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          args={[0.1, 0.3, 0.1]}
          position={[
            (Math.random() - 0.5) * 20,
            Math.random() * 10,
            (Math.random() - 0.5) * 20
          ]}
          rotation={[
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ]}
        >
          <meshPhongMaterial 
            color={getThemeColor()}
            transparent
            opacity={0.6}
            emissive={getThemeColor()}
            emissiveIntensity={0.2}
          />
        </Box>
      ))}
    </group>
  );
};

// 3D Fog Effect
export const FogEffect3D = ({ theme = 'mystery' }) => {
  const getThemeColor = () => {
    switch (theme) {
      case 'mystery':
        return '#2C1810';
      case 'scifi':
        return '#0A0A2E';
      case 'horror':
        return '#1C1C1C';
      default:
        return '#2C1810';
    }
  };

  return (
    <fog 
      attach="fog" 
      args={[getThemeColor(), 1, 50]} 
    />
  );
};

// 3D Sound Visualization
export const SoundVisualization3D = ({ isPlaying, frequency = 440 }) => {
  const barsRef = useRef();

  useFrame((state) => {
    if (barsRef.current && isPlaying) {
      barsRef.current.children.forEach((bar, index) => {
        const height = Math.sin(state.clock.elapsedTime * frequency * 0.001 + index) * 0.5 + 0.5;
        bar.scale.y = height;
      });
    }
  });

  return (
    <group ref={barsRef} position={[8, 0, 0]}>
      {Array.from({ length: 32 }).map((_, i) => (
        <Box
          key={i}
          args={[0.1, 1, 0.1]}
          position={[i * 0.2 - 3, 0, 0]}
        >
          <meshLambertMaterial color="#00FFFF" />
        </Box>
      ))}
    </group>
  );
};

// 3D Portal Effect
export const Portal3D = ({ isActive, onEnter }) => {
  const portalRef = useRef();

  useFrame((state) => {
    if (portalRef.current) {
      portalRef.current.rotation.z = state.clock.elapsedTime * 2;
      portalRef.current.scale.setScalar(isActive ? 1.2 : 1);
    }
  });

  return (
    <group position={[0, 0, 9]} onClick={onEnter}>
      <Cylinder
        ref={portalRef}
        args={[2, 2, 0.1, 32]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial 
          color={isActive ? '#00FF00' : '#4ECDC4'}
          transparent
          opacity={0.8}
        />
      </Cylinder>
      
      {/* Portal Glow */}
      <Cylinder
        args={[2.5, 2.5, 0.05, 32]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial 
          color="#00FFFF"
          transparent
          opacity={0.3}
        />
      </Cylinder>
    </group>
  );
};

// 3D Holographic Display
export const HolographicDisplay3D = ({ text, theme = 'scifi' }) => {
  const displayRef = useRef();

  useFrame((state) => {
    if (displayRef.current) {
      displayRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      displayRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={displayRef} position={[-8, 2, 0]}>
      <Plane args={[4, 2]}>
        <meshBasicMaterial 
          color={theme === 'scifi' ? '#00FFFF' : '#4ECDC4'}
          transparent
          opacity={0.3}
        />
      </Plane>
      
      <Text
        position={[0, 0, 0.1]}
        fontSize={0.5}
        color={theme === 'scifi' ? '#00FFFF' : '#4ECDC4'}
        anchorX="center"
        anchorY="middle"
        font="/fonts/helvetiker_regular.typeface.json"
      >
        {text}
      </Text>
    </group>
  );
};
