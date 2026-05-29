// Layout configurations for different card arrangements
// Each layout returns an array of { position: [x, y, z], rotation: [rx, ry, rz] }

const LAYOUTS = {
  // Cross/Plus formation
  cross: (count) => {
    const items = [];
    const spacing = 2.8;
    // Horizontal bar
    const hCount = Math.min(count, 7);
    for (let i = 0; i < hCount; i++) {
      items.push({
        position: [(i - (hCount - 1) / 2) * spacing, 0, 0],
        rotation: [0, 0, 0],
      });
    }
    // Vertical bar
    const vCount = Math.min(count - hCount, 5);
    for (let i = 0; i < vCount; i++) {
      const idx = hCount + i;
      if (idx >= count) break;
      items.push({
        position: [0, (i - (vCount - 1) / 2) * spacing, 0],
        rotation: [0, 0, 0],
      });
    }
    // Remaining cards scattered around center
    for (let i = hCount + vCount; i < count; i++) {
      const angle = ((i - hCount - vCount) / (count - hCount - vCount)) * Math.PI * 2;
      const r = 4 + Math.random() * 2;
      items.push({
        position: [Math.cos(angle) * r, Math.sin(angle) * r, -2 - Math.random() * 3],
        rotation: [Math.random() * 0.3, Math.random() * 0.5, Math.random() * 0.2],
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
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.6,
          Math.sin(angle) * 2,
        ],
        rotation: [0, -angle * 0.3, 0],
      });
    }
    return items;
  },

  // Spiral formation
  spiral: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 6;
      const radius = 2 + t * 8;
      const y = (t - 0.5) * 12;
      items.push({
        position: [
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius * 0.5,
        ],
        rotation: [0, -angle * 0.2, Math.sin(angle) * 0.1],
      });
    }
    return items;
  },

  // Scattered/Explosion formation
  scattered: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 8;
      items.push({
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.6,
          r * Math.cos(phi) * 0.5,
        ],
        rotation: [
          Math.random() * Math.PI * 0.5,
          Math.random() * Math.PI,
          Math.random() * Math.PI * 0.3,
        ],
      });
    }
    return items;
  },

  // Grid/Wall formation
  grid: (count) => {
    const items = [];
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const spacingX = 3;
    const spacingY = 3.8;
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      items.push({
        position: [
          (col - (cols - 1) / 2) * spacingX,
          ((rows - 1) / 2 - row) * spacingY,
          0,
        ],
        rotation: [0, 0, 0],
      });
    }
    return items;
  },

  // Helix/DNA formation
  helix: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 4;
      const y = (t - 0.5) * 16;
      const side = i % 2 === 0 ? 1 : -1;
      items.push({
        position: [
          Math.cos(angle) * 4 * side,
          y,
          Math.sin(angle) * 3,
        ],
        rotation: [0, -angle * 0.3, side * 0.2],
      });
    }
    return items;
  },
};

export const LAYOUT_NAMES = Object.keys(LAYOUTS);

export function getLayout(name, count) {
  const fn = LAYOUTS[name] || LAYOUTS.circle;
  const items = fn(count);
  // Pad or trim to exact count
  while (items.length < count) {
    items.push({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5,
      ],
      rotation: [
        Math.random() * 0.5,
        Math.random() * 0.5,
        Math.random() * 0.3,
      ],
    });
  }
  return items.slice(0, count);
}
