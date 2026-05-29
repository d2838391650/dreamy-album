// Layout configurations for different card arrangements
// Each layout returns an array of { position: [x, y, z], rotation: [rx, ry, rz] }

const LAYOUTS = {
  // Star formation
  star: (count) => {
    const items = [];
    const points = 5;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 2;
      const starAngle = angle * points;
      const r = 4 + 4 * Math.abs(Math.cos(starAngle / 2));
      const z = Math.sin(angle * 3) * 1;
      items.push({
        position: [Math.cos(angle) * r, Math.sin(angle) * r * 0.8, z],
        rotation: [0, -angle * 0.1, 0],
      });
    }
    return items;
  },

  // Wave formation
  wave: (count) => {
    const items = [];
    const cols = Math.ceil(Math.sqrt(count * 1.5));
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * 2.8;
      const y = (row - 2) * 3.2;
      const z = Math.sin(col * 0.8) * 1.5 + Math.cos(row * 0.6) * 0.8;
      items.push({
        position: [x, y, z],
        rotation: [Math.sin(col * 0.8) * 0.1, 0, 0],
      });
    }
    return items;
  },

  // Circle/Ring formation
  circle: (count) => {
    const items = [];
    const radius = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      items.push({
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.6, Math.sin(angle) * 1.5],
        rotation: [0, -angle * 0.15, 0],
      });
    }
    return items;
  },

  // Spiral formation
  spiral: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 5;
      const radius = 2 + t * 7;
      const y = (t - 0.5) * 12;
      items.push({
        position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius * 0.4],
        rotation: [0, -angle * 0.1, 0],
      });
    }
    return items;
  },

  // Scattered/Explosion formation
  scattered: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * ((i + 0.5) / count) - 1);
      const theta = (1 + Math.sqrt(5)) * i;
      const r = 5 + (i / count) * 7;
      items.push({
        position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta) * 0.5, r * Math.cos(phi) * 0.4],
        rotation: [Math.sin(i) * 0.1, Math.cos(i) * 0.15, Math.sin(i * 0.7) * 0.05],
      });
    }
    return items;
  },

  // Heart shape formation
  heart: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
      const scale = 0.45;
      items.push({
        position: [x * scale, y * scale, Math.sin(t * 2) * 0.5],
        rotation: [0, 0, 0],
      });
    }
    return items;
  },

  // Galaxy/Swirl formation
  galaxy: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 6;
      const r = 1 + t * 9;
      const y = (t - 0.5) * 4 + Math.sin(angle * 2) * 0.5;
      items.push({
        position: [Math.cos(angle) * r, y, Math.sin(angle) * r * 0.3],
        rotation: [0, -angle * 0.12, t * 0.1],
      });
    }
    return items;
  },
};

export const LAYOUT_NAMES = Object.keys(LAYOUTS);

export function getLayout(name, count) {
  const fn = LAYOUTS[name] || LAYOUTS.circle;
  const items = fn(count);
  while (items.length < count) {
    const angle = (items.length / count) * Math.PI * 2;
    items.push({
      position: [Math.cos(angle) * 6, Math.sin(angle) * 4, -2],
      rotation: [0, 0, 0],
    });
  }
  return items.slice(0, count);
}
