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
    // Vertical bar — offset z slightly to avoid overlap with horizontal center
    const vCount = Math.min(count - hCount, 5);
    for (let i = 0; i < vCount; i++) {
      const idx = hCount + i;
      if (idx >= count) break;
      const y = (i - (vCount - 1) / 2) * spacing;
      // Push vertical cards slightly forward so they don't z-fight with horizontal
      const zOffset = y === 0 ? 0.5 : 0;
      items.push({
        position: [0, y, zOffset],
        rotation: [0, 0, 0],
      });
    }
    // Remaining cards — arranged in a ring behind, no random rotation
    for (let i = hCount + vCount; i < count; i++) {
      const angle = ((i - hCount - vCount) / Math.max(count - hCount - vCount, 1)) * Math.PI * 2;
      const r = 5;
      items.push({
        position: [Math.cos(angle) * r, Math.sin(angle) * r, -3],
        rotation: [0, 0, 0],
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
          Math.sin(angle) * 1.5,
        ],
        // Cards face outward slightly but mostly forward
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
        position: [
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius * 0.4,
        ],
        // Gentle rotation, always mostly facing camera
        rotation: [0, -angle * 0.1, 0],
      });
    }
    return items;
  },

  // Scattered/Explosion formation — all cards face camera
  scattered: (count) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * ((i + 0.5) / count) - 1);
      const theta = (1 + Math.sqrt(5)) * i; // golden angle for even distribution
      const r = 5 + (i / count) * 7;
      items.push({
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.5,
          r * Math.cos(phi) * 0.4,
        ],
        // All cards face forward, slight tilt only
        rotation: [
          Math.sin(i) * 0.1,
          Math.cos(i) * 0.15,
          Math.sin(i * 0.7) * 0.05,
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
      const angle = t * Math.PI * 3.5;
      const y = (t - 0.5) * 14;
      const side = i % 2 === 0 ? 1 : -1;
      items.push({
        position: [
          Math.cos(angle) * 4 * side,
          y,
          Math.sin(angle) * 2.5,
        ],
        // Gentle tilt, always facing forward
        rotation: [0, -angle * 0.08, side * 0.08],
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
    const angle = (items.length / count) * Math.PI * 2;
    items.push({
      position: [Math.cos(angle) * 6, Math.sin(angle) * 4, -2],
      rotation: [0, 0, 0],
    });
  }
  return items.slice(0, count);
}
