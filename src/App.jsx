import { useState, useRef, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { getLayout, LAYOUT_NAMES } from './layouts';
import './App.css';

// ─── Photo URLs ──────────────────────────────────────────────────────────────
const PHOTO_COUNT = 39;
const photoUrls = Array.from(
  { length: PHOTO_COUNT },
  (_, i) => `/photos/照片_${String(i).padStart(3, '0')}.jpg`
);

// ─── 3D Card Component ──────────────────────────────────────────────────────
function Card3D({ url, index, targetPos, targetRot, isFocused, onSelect, onDoubleClick }) {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(url);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }, [texture]);

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ff88cc',
      transparent: true,
      opacity: 0.0,
    });
  }, []);

  // Animate position and rotation with GSAP
  useEffect(() => {
    if (!groupRef.current) return;
    gsap.to(groupRef.current.position, {
      x: targetPos[0],
      y: targetPos[1],
      z: targetPos[2],
      duration: 1.8,
      ease: 'power3.inOut',
    });
    gsap.to(groupRef.current.rotation, {
      x: targetRot[0],
      y: targetRot[1],
      z: targetRot[2],
      duration: 1.8,
      ease: 'power3.inOut',
    });
  }, [targetPos, targetRot]);

  // Hover and focus animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = isFocused ? 1.5 : hovered ? 1.08 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 5
    );
    // Glow on hover
    glowMaterial.opacity = THREE.MathUtils.lerp(
      glowMaterial.opacity,
      hovered ? 0.25 : 0,
      delta * 5
    );
    // Subtle floating when hovered
    if (hovered && !isFocused) {
      groupRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.001;
    }
  });

  return (
    <group
      ref={groupRef}
      position={targetPos}
      rotation={targetRot}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(index);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Card photo */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <planeGeometry args={[2.4, 3.2]} />
        <primitive object={material} attach="material" />
      </mesh>
      {/* Glow border */}
      <mesh position={[0, 0, -0.15]}>
        <planeGeometry args={[2.6, 3.4]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
      {/* Photo frame shadow */}
      <mesh position={[0.06, -0.06, -0.3]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// ─── Floating Particles ─────────────────────────────────────────────────────
function Particles({ count = 250 }) {
  const points = useRef();
  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
      const r = Math.random();
      if (r < 0.35) {
        col[i * 3] = 1; col[i * 3 + 1] = 0.55; col[i * 3 + 2] = 0.75;
      } else if (r < 0.65) {
        col[i * 3] = 0.75; col[i * 3 + 1] = 0.45; col[i * 3 + 2] = 1;
      } else if (r < 0.85) {
        col[i * 3] = 1; col[i * 3 + 1] = 0.85; col[i * 3 + 2] = 0.95;
      } else {
        col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1;
      }
      sz[i] = 0.04 + Math.random() * 0.08;
    }
    return [pos, col, sz];
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const time = state.clock.elapsedTime;
    const posArr = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += Math.sin(time * 0.4 + i * 0.15) * 0.004;
      posArr[i * 3] += Math.cos(time * 0.25 + i * 0.08) * 0.003;
      posArr[i * 3 + 2] += Math.sin(time * 0.2 + i * 0.12) * 0.002;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.rotation.y = time * 0.015;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Sparkle Ring (around title area in 3D) ─────────────────────────────────
function SparkleRing() {
  const ref = useRef();
  const count = 60;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 3 + Math.random() * 0.5;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = Math.sin(angle) * r * 0.4 + 4;
      arr[i * 3 + 2] = Math.sin(angle) * 1.5;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#ffccdd"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Mouse Drag Rotate (inertia-based scene rotation) ──────────────────────
function DragRotate({ dragRef, children }) {
  const groupRef = useRef();
  const velocity = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const didMove = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const lastMouse = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const onPointerDown = (e) => {
      isDragging.current = true;
      didMove.current = false;
      startMouse.current = { x: e.clientX, y: e.clientY };
      lastMouse.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
    };

    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      const totalDx = e.clientX - startMouse.current.x;
      const totalDy = e.clientY - startMouse.current.y;

      // Mark as drag if moved more than 5px
      if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
        didMove.current = true;
      }

      lastMouse.current = { x: e.clientX, y: e.clientY };

      targetRotation.current.y += dx * 0.004;
      targetRotation.current.x += dy * 0.003;
      targetRotation.current.x = Math.max(-0.4, Math.min(0.4, targetRotation.current.x));
      targetRotation.current.y = Math.max(-0.8, Math.min(0.8, targetRotation.current.y));

      velocity.current = { x: dy * 0.003, y: dx * 0.005 };
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Expose drag state and group rotation for camera tracking
    if (dragRef) {
      dragRef.current = {
        isDragging: () => didMove.current,
        groupRef: groupRef,
      };
    }

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragRef]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Apply inertia when not dragging
    if (!isDragging.current) {
      targetRotation.current.y += velocity.current.y;
      targetRotation.current.x += velocity.current.x;
      targetRotation.current.x = Math.max(-0.4, Math.min(0.4, targetRotation.current.x));
      targetRotation.current.y = Math.max(-0.8, Math.min(0.8, targetRotation.current.y));

      // Decay velocity
      velocity.current.x *= 0.95;
      velocity.current.y *= 0.95;

      if (Math.abs(velocity.current.x) < 0.0001) velocity.current.x = 0;
      if (Math.abs(velocity.current.y) < 0.0001) velocity.current.y = 0;
    }

    // Smooth rotation interpolation
    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.08;
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.08;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ─── Camera Controller ──────────────────────────────────────────────────────
function CameraController({ focusedIndex, cards, dragRef }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 22));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (focusedIndex !== null && cards[focusedIndex]) {
      const p = cards[focusedIndex].position;
      const localPos = new THREE.Vector3(p[0], p[1], p[2]);

      // Transform card position by DragRotate group's world rotation
      const group = dragRef?.current?.groupRef?.current;
      if (group) {
        localPos.applyEuler(group.rotation);
      }

      targetPos.current.set(localPos.x, localPos.y, localPos.z + 5.5);
      lookTarget.current.copy(localPos);
    } else {
      targetPos.current.set(0, 0, 22);
      lookTarget.current.set(0, 0, 0);
    }
    camera.position.lerp(targetPos.current, 0.04);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    camera.lookAt(
      THREE.MathUtils.lerp(camera.position.x + currentLook.x * 10, lookTarget.current.x, 0.04),
      THREE.MathUtils.lerp(camera.position.y + currentLook.y * 10, lookTarget.current.y, 0.04),
      THREE.MathUtils.lerp(camera.position.z + currentLook.z * 10, lookTarget.current.z, 0.04)
    );
  });

  return null;
}

// ─── Loading Screen ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner" />
        <p className="loading-text">加载梦幻相册中...</p>
      </div>
    </div>
  );
}

// ─── 3D Scene ──────────────────────────────────────────────────────────────
function Scene({ layoutName, focusedIndex, onSelectCard, onDoubleClickCard, dragRef }) {
  const cards = useMemo(
    () => getLayout(layoutName, PHOTO_COUNT),
    [layoutName]
  );

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 12, 8]} intensity={0.7} castShadow shadow-mapSize={1024} />
      <pointLight position={[-8, 6, 5]} intensity={0.6} color="#ff66aa" distance={30} />
      <pointLight position={[8, -4, 6]} intensity={0.4} color="#6666ff" distance={25} />
      <pointLight position={[0, 0, 10]} intensity={0.3} color="#ffffff" distance={20} />

      <CameraController focusedIndex={focusedIndex} cards={cards} dragRef={dragRef} />

      <DragRotate dragRef={dragRef}>
        <Suspense fallback={null}>
          {photoUrls.map((url, i) => (
            <Card3D
              key={i}
              url={url}
              index={i}
              targetPos={cards[i].position}
              targetRot={cards[i].rotation}
              isFocused={focusedIndex === i}
              onSelect={onSelectCard}
              onDoubleClick={onDoubleClickCard}
            />
          ))}
        </Suspense>

        <Particles count={300} />
        <SparkleRing />
      </DragRotate>

      <fog attach="fog" args={['#0a0515', 25, 60]} />
    </>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef({ isDragging: () => false });
  const layoutName = LAYOUT_NAMES[layoutIndex];

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to cycle layouts
  useEffect(() => {
    const handleWheel = (e) => {
      if (focusedIndex !== null) return;
      e.preventDefault();
      const threshold = 20;
      if (e.deltaY > threshold) {
        setLayoutIndex((prev) => (prev + 1) % LAYOUT_NAMES.length);
      } else if (e.deltaY < -threshold) {
        setLayoutIndex((prev) => (prev - 1 + LAYOUT_NAMES.length) % LAYOUT_NAMES.length);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [focusedIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setFocusedIndex(null);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setLayoutIndex((prev) => (prev + 1) % LAYOUT_NAMES.length);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setLayoutIndex((prev) => (prev - 1 + LAYOUT_NAMES.length) % LAYOUT_NAMES.length);
      }
      if (e.key === 'h' || e.key === 'H') setShowUI((prev) => !prev);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSelectCard = useCallback((index) => {
    // Don't select cards while dragging
    if (dragRef.current.isDragging()) return;
    setFocusedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handleDoubleClickCard = useCallback((index) => {
    if (dragRef.current.isDragging()) return;
    setFocusedIndex(index);
  }, []);

  if (!loaded) return <LoadingScreen />;

  return (
    <div className="app">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 22], fov: 50 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0515');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.3;
        }}
      >
        <Scene
          layoutName={layoutName}
          focusedIndex={focusedIndex}
          onSelectCard={handleSelectCard}
          onDoubleClickCard={handleDoubleClickCard}
          dragRef={dragRef}
        />
      </Canvas>

      {/* UI Overlay */}
      {showUI && (
        <div className="ui-overlay">
          {/* Title */}
          <div className="title-area">
            <h1 className="main-title">生日快乐</h1>
            <p className="sub-title">Happy Birthday to You</p>
          </div>

          {/* Layout indicator */}
          <div className="layout-indicator">
            <div className="layout-badge">
              <span className="layout-label">阵型</span>
              <span className="layout-name">{layoutName.toUpperCase()}</span>
            </div>
            <span className="layout-counter">
              {layoutIndex + 1} / {LAYOUT_NAMES.length}
            </span>
          </div>

          {/* Layout navigation dots */}
          <div className="layout-dots">
            {LAYOUT_NAMES.map((name, i) => (
              <button
                key={name}
                className={`dot ${i === layoutIndex ? 'active' : ''}`}
                onClick={() => setLayoutIndex(i)}
                title={name}
              >
                <span className="dot-label">{name.slice(0, 1).toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Controls hint */}
          <div className="controls-hint">
            <div className="hint-row">
              <kbd>鼠标拖拽</kbd>
              <span>旋转视角</span>
            </div>
            <div className="hint-row">
              <kbd>滚轮</kbd> / <kbd>方向键</kbd>
              <span>切换阵型</span>
            </div>
            <div className="hint-row">
              <kbd>单击</kbd>
              <span>选中卡片</span>
            </div>
            <div className="hint-row">
              <kbd>双击</kbd>
              <span>放大查看</span>
            </div>
            <div className="hint-row">
              <kbd>ESC</kbd>
              <span>返回全景</span>
            </div>
            <div className="hint-row">
              <kbd>H</kbd>
              <span>隐藏界面</span>
            </div>
          </div>
        </div>
      )}

      {/* Focused card info */}
      {focusedIndex !== null && (
        <div className="focused-info">
          <span className="focused-counter">
            照片 {focusedIndex + 1} / {PHOTO_COUNT}
          </span>
          <button className="close-btn" onClick={() => setFocusedIndex(null)}>
            ✕ 返回
          </button>
        </div>
      )}

      {/* Hidden UI hint when hidden */}
      {!showUI && (
        <div className="show-hint">
          按 <kbd>H</kbd> 显示界面
        </div>
      )}
    </div>
  );
}
