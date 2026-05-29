// Layout configurations for different card arrangements
// Each layout returns an array of { position: [x, y, z], rotation: [rx, ry, rz] }

const LAYOUTS = {
  // Hexagonal/Honeycomb formation — no overlapping
  honeycomb: (count) => {
    const items = [];
    const spacingX = 3;
    const spacingY = 2.6;
    // Fill hex grid row by row
    let placed = 0;
    let row = 0;
    while (placed < count) {
      const cols = row % 2 === 0 ? 6 : 5;
      const offsetX = row % 2 === 0 ? 0 : spacingX * 0.5;
      for (let col = 0; col < cols && placed < count; col++) {
        items.push({
          position: [
            (col - (cols - 1) / 2) * spacingX + offsetX,
            (row - 2) * spacingY,
            Math.sin(placed * 0.5) * 0.3,
          ],
          rotation: [0, 0, 0],
        });
        placed++;
      }
      row++;
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
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.5,
          r * Math.cos(phi) * 0.4,
        ],
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
  while (items.length < count) {
    const angle = (items.length / count) * Math.PI * 2;
    items.push({
      position: [Math.cos(angle) * 6, Math.sin(angle) * 4, -2],
      rotation: [0, 0, 0],
    });
  }
  return items.slice(0, count);
}
