import { useState, useRef, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { getLayout, LAYOUT_NAMES } from './layouts';
import './App.css';

const PHOTO_COUNT = 39;
const BASE = import.meta.env.BASE_URL || '/';
const photoUrls = Array.from(
  { length: PHOTO_COUNT },
  (_, i) => `${BASE}photos/照片_${String(i).padStart(3, '0')}.jpg`
);

// ─── 3D Card ────────────────────────────────────────────────────────────────
function Card3D({ url, index, targetPos, targetRot, isFocused, onSelect, onDoubleClick, transitionKey }) {
  const groupRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const texture = useTexture(url);
  const initialized = useRef(false);

  useEffect(() => {
    if (!groupRef.current) return;
    const pos = groupRef.current.position;
    const rot = groupRef.current.rotation;

    // Kill existing tweens to prevent conflicts
    gsap.killTweensOf(pos);
    gsap.killTweensOf(rot);

    if (!initialized.current) {
      // First render: set position immediately without animation
      pos.set(targetPos[0], targetPos[1], targetPos[2]);
      rot.set(targetRot[0], targetRot[1], targetRot[2]);
      initialized.current = true;
    } else {
      // Subsequent changes: animate from current position to target
      gsap.fromTo(pos,
        { x: pos.x, y: pos.y, z: pos.z },
        { x: targetPos[0], y: targetPos[1], z: targetPos[2], duration: 2.0, ease: 'power2.inOut' }
      );
      gsap.fromTo(rot,
        { x: rot.x, y: rot.y, z: rot.z },
        { x: targetRot[0], y: targetRot[1], z: targetRot[2], duration: 2.0, ease: 'power2.inOut' }
      );
    }
  }, [targetPos, targetRot, transitionKey]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = isFocused ? 1.5 : hovered ? 1.08 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), delta * 4);
    if (glowRef.current) {
      glowRef.current.opacity = THREE.MathUtils.lerp(
        glowRef.current.opacity, hovered ? 0.3 : 0, delta * 4
      );
    }
    if (hovered && !isFocused) {
      groupRef.current.position.y += Math.sin(Date.now() * 0.003) * 0.0015;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onSelect(index); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(index); }}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <mesh>
        <planeGeometry args={[2.4, 3.2]} />
        <meshStandardMaterial map={texture} roughness={0.25} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[2.6, 3.4]} />
        <meshBasicMaterial ref={glowRef} color="#ff88cc" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.05, -0.05, -0.05]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ─── Particles ──────────────────────────────────────────────────────────────
function Particles({ count = 250 }) {
  const points = useRef();
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
      const r = Math.random();
      if (r < 0.35) { col[i*3]=1; col[i*3+1]=0.55; col[i*3+2]=0.75; }
      else if (r < 0.65) { col[i*3]=0.75; col[i*3+1]=0.45; col[i*3+2]=1; }
      else if (r < 0.85) { col[i*3]=1; col[i*3+1]=0.85; col[i*3+2]=0.95; }
      else { col[i*3]=1; col[i*3+1]=1; col[i*3+2]=1; }
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    const time = state.clock.elapsedTime;
    const arr = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i*3+1] += Math.sin(time*0.3 + i*0.15) * 0.003;
      arr[i*3] += Math.cos(time*0.2 + i*0.08) * 0.002;
      arr[i*3+2] += Math.sin(time*0.15 + i*0.12) * 0.0015;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.rotation.y = time * 0.01;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.07} vertexColors transparent opacity={0.65} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ─── SparkleRing ────────────────────────────────────────────────────────────
function SparkleRing() {
  const ref = useRef();
  const count = 60;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 3 + Math.random() * 0.5;
      arr[i*3] = Math.cos(angle) * r;
      arr[i*3+1] = Math.sin(angle) * r * 0.4 + 4;
      arr[i*3+2] = Math.sin(angle) * 1.5;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#ffccdd" transparent opacity={0.8} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ─── DragRotate ─────────────────────────────────────────────────────────────
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
      if (Math.abs(e.clientX - startMouse.current.x) > 5 || Math.abs(e.clientY - startMouse.current.y) > 5) {
        didMove.current = true;
      }
      lastMouse.current = { x: e.clientX, y: e.clientY };
      targetRotation.current.y += dx * 0.005;
      targetRotation.current.x += dy * 0.003;
      targetRotation.current.x = Math.max(-0.6, Math.min(0.6, targetRotation.current.x));
      velocity.current = { x: dy * 0.003, y: dx * 0.005 };
    };
    const onPointerUp = () => { isDragging.current = false; };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    if (dragRef) {
      dragRef.current = { isDragging: () => didMove.current, groupRef };
    }

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragRef]);

  useFrame(() => {
    if (!groupRef.current) return;
    if (!isDragging.current) {
      targetRotation.current.y += velocity.current.y;
      targetRotation.current.x += velocity.current.x;
      targetRotation.current.x = Math.max(-0.6, Math.min(0.6, targetRotation.current.x));
      velocity.current.x *= 0.97;
      velocity.current.y *= 0.97;
      if (Math.abs(velocity.current.x) < 0.0001) velocity.current.x = 0;
      if (Math.abs(velocity.current.y) < 0.0001) velocity.current.y = 0;
    }
    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.06;
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.06;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ─── CameraController ───────────────────────────────────────────────────────
function CameraController({ focusedIndex, cards, dragRef }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 22));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (focusedIndex !== null && cards[focusedIndex]) {
      const p = cards[focusedIndex].position;
      const localPos = new THREE.Vector3(p[0], p[1], p[2]);
      const group = dragRef?.current?.groupRef?.current;
      if (group) localPos.applyEuler(group.rotation);
      targetPos.current.set(localPos.x, localPos.y, localPos.z + 5.5);
      lookTarget.current.copy(localPos);
    } else {
      targetPos.current.set(0, 0, 22);
      lookTarget.current.set(0, 0, 0);
    }
    camera.position.lerp(targetPos.current, 0.035);
    const cl = new THREE.Vector3();
    camera.getWorldDirection(cl);
    camera.lookAt(
      THREE.MathUtils.lerp(camera.position.x + cl.x*10, lookTarget.current.x, 0.035),
      THREE.MathUtils.lerp(camera.position.y + cl.y*10, lookTarget.current.y, 0.035),
      THREE.MathUtils.lerp(camera.position.z + cl.z*10, lookTarget.current.z, 0.035)
    );
  });

  return null;
}

// ─── Scene ──────────────────────────────────────────────────────────────────
function Scene({ layoutName, focusedIndex, onSelectCard, onDoubleClickCard, dragRef, transitionKey }) {
  const cards = useMemo(() => getLayout(layoutName, PHOTO_COUNT), [layoutName]);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 12, 8]} intensity={0.7} />
      <pointLight position={[-8, 6, 5]} intensity={0.6} color="#ff66aa" distance={30} />
      <pointLight position={[8, -4, 6]} intensity={0.4} color="#6666ff" distance={25} />
      <pointLight position={[0, 0, 10]} intensity={0.3} color="#ffffff" distance={20} />
      <CameraController focusedIndex={focusedIndex} cards={cards} dragRef={dragRef} />
      <DragRotate dragRef={dragRef}>
        <Suspense fallback={null}>
          {photoUrls.map((url, i) => (
            <Card3D key={i} url={url} index={i} targetPos={cards[i].position} targetRot={cards[i].rotation}
              isFocused={focusedIndex === i} onSelect={onSelectCard} onDoubleClick={onDoubleClickCard} transitionKey={transitionKey} />
          ))}
        </Suspense>
        <Particles count={300} />
        <SparkleRing />
      </DragRotate>
    </>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusicPopup, setShowMusicPopup] = useState(true);
  const audioRef = useRef(null);
  const dragRef = useRef({ isDragging: () => false });
  const layoutName = LAYOUT_NAMES[layoutIndex];

  const switchLayout = useCallback((newIndex) => {
    setLayoutIndex(newIndex);
    setTransitionKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const handleMusicPopup = useCallback((play) => {
    setShowMusicPopup(false);
    if (play) {
      const audio = audioRef.current;
      if (audio) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (focusedIndex !== null) return;
      e.preventDefault();
      if (e.deltaY > 20) switchLayout((layoutIndex + 1) % LAYOUT_NAMES.length);
      else if (e.deltaY < -20) switchLayout((layoutIndex - 1 + LAYOUT_NAMES.length) % LAYOUT_NAMES.length);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [focusedIndex, layoutIndex, switchLayout]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setFocusedIndex(null);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') switchLayout((layoutIndex + 1) % LAYOUT_NAMES.length);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') switchLayout((layoutIndex - 1 + LAYOUT_NAMES.length) % LAYOUT_NAMES.length);
      if (e.key === 'h' || e.key === 'H') setShowUI((p) => !p);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [layoutIndex, switchLayout]);

  const handleSelectCard = useCallback((index) => {
    if (dragRef.current.isDragging()) return;
    setFocusedIndex((p) => (p === index ? null : index));
  }, []);

  const handleDoubleClickCard = useCallback((index) => {
    if (dragRef.current.isDragging()) return;
    setFocusedIndex(index);
  }, []);

  if (!loaded) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner" />
        <p className="loading-text">加载梦幻相册中...</p>
      </div>
    </div>
  );

  return (
    <div className="app">
      {/* Floating Hearts Background */}
      <div className="hearts-bg">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="floating-heart" style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${8 + Math.random() * 12}s`,
            fontSize: `${16 + Math.random() * 32}px`,
            opacity: 0.15 + Math.random() * 0.25,
          }}>♥</div>
        ))}
        {/* Center Decor Image */}
        <div className="center-decor">
          <img src={`${BASE}cute-characters.png`} alt="" />
        </div>
      </div>
      <div className="cute-pattern" />

      <audio ref={audioRef} src={`${BASE}birthday.m4a`} loop />

      {showMusicPopup && (
        <div className="music-popup-overlay">
          <div className="music-popup">
            <div className="music-popup-icon">🎵</div>
            <h2 className="music-popup-title">生日快乐</h2>
            <p className="music-popup-desc">是否播放生日快乐歌？</p>
            <div className="music-popup-buttons">
              <button className="music-popup-btn play" onClick={() => handleMusicPopup(true)}>播放音乐</button>
              <button className="music-popup-btn skip" onClick={() => handleMusicPopup(false)}>暂时不用</button>
            </div>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 22], fov: 50 }} gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}>
        <Scene layoutName={layoutName} focusedIndex={focusedIndex} onSelectCard={handleSelectCard} onDoubleClickCard={handleDoubleClickCard} dragRef={dragRef} transitionKey={transitionKey} />
      </Canvas>

      {showUI && (
        <div className="ui-overlay">
          <div className="title-area">
            <h1 className="main-title">生日快乐</h1>
            <p className="sub-title">Happy Birthday to You</p>
          </div>
          <div className="layout-indicator">
            <div className="layout-badge">
              <span className="layout-label">阵型</span>
              <span className="layout-name">{layoutName.toUpperCase()}</span>
            </div>
            <span className="layout-counter">{layoutIndex+1} / {LAYOUT_NAMES.length}</span>
          </div>

          <button className="music-btn" onClick={toggleMusic} title={isPlaying ? '暂停音乐' : '播放音乐'}>
            {isPlaying ? '♪' : '♪'}
            <span className="music-status">{isPlaying ? '播放中' : '已暂停'}</span>
          </button>
          <div className="layout-dots">
            {LAYOUT_NAMES.map((name, i) => (
              <button key={name} className={`dot ${i===layoutIndex?'active':''}`} onClick={() => switchLayout(i)} title={name}>
                <span className="dot-label">{name.slice(0,1).toUpperCase()}</span>
              </button>
            ))}
          </div>
          <div className="controls-hint">
            <div className="hint-row"><kbd>鼠标拖拽</kbd><span>旋转视角</span></div>
            <div className="hint-row"><kbd>滚轮</kbd> / <kbd>方向键</kbd><span>切换阵型</span></div>
            <div className="hint-row"><kbd>单击</kbd><span>选中卡片</span></div>
            <div className="hint-row"><kbd>双击</kbd><span>放大查看</span></div>
            <div className="hint-row"><kbd>ESC</kbd><span>返回全景</span></div>
            <div className="hint-row"><kbd>H</kbd><span>隐藏界面</span></div>
          </div>
        </div>
      )}

      {focusedIndex !== null && (
        <div className="focused-info">
          <span className="focused-counter">照片 {focusedIndex+1} / {PHOTO_COUNT}</span>
          <button className="close-btn" onClick={() => setFocusedIndex(null)}>✕ 返回</button>
        </div>
      )}

      {!showUI && <div className="show-hint">按 <kbd>H</kbd> 显示界面</div>}
    </div>
  );
}
