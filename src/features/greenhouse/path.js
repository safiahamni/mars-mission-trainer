// Greenhouse route geometry shared by the path drawing and player collision.
// Coordinates use the room's SVG viewBox, so the same route scales with layout.
export const PATH = Object.freeze({
  width: 880,
  height: 472,
  half: 14,
  start: Object.freeze({ x: 440, y: 448 }),
  lines: Object.freeze([
    [[440, 472], [440, 380]],                              // base exit to lower corridor
    [[440, 380], [200, 380], [200, 100]],                 // left corridor and vertical aisle
    [[200, 100], [120, 100]],                             // climate console branch
    [[200, 100], [686, 100]],                             // soil lab branch
    [[200, 240], [80, 240]],                              // shield console
    [[200, 380], [132, 380]],                             // compost sorting station
    [[200, 380], [760, 380], [760, 100], [686, 100]],     // wiring and right aisle
  ]),
});

const PATH_BOXES = [];
for (const line of PATH.lines) {
  for (let i = 1; i < line.length; i += 1) {
    const [x1, y1] = line[i - 1];
    const [x2, y2] = line[i];
    PATH_BOXES.push({
      x1: Math.min(x1, x2) - PATH.half,
      x2: Math.max(x1, x2) + PATH.half,
      y1: Math.min(y1, y2) - PATH.half,
      y2: Math.max(y1, y2) + PATH.half,
    });
  }
}

export function onPath(x, y) {
  return PATH_BOXES.some((box) => x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2);
}

/** Move on the route, sliding along an edge when one requested axis is blocked. */
export function moveOnPath(pos, dx, dy) {
  if (onPath(pos.x + dx, pos.y)) pos.x += dx;
  if (onPath(pos.x, pos.y + dy)) pos.y += dy;
  return pos;
}

/** Draw a sandy walkable route with dashed edging and footprints/dots. */
export function drawPath(svg) {
  if (!svg) throw new TypeError("A path SVG element is required.");
  svg.setAttribute("viewBox", `0 0 ${PATH.width} ${PATH.height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  const d = PATH.lines.map((line) => `M ${line.map((point) => point.join(" ")).join(" L ")}`).join(" ");
  svg.innerHTML = `
    <defs><pattern id="greenhouse-path-dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#E8B98A"/><circle cx="10" cy="10" r="3" fill="#C98F5E"/>
    </pattern></defs>
    <g fill="none" stroke-linejoin="round" stroke-linecap="round">
      <path d="${d}" stroke="url(#greenhouse-path-dots)" stroke-width="50"/>
      <path d="${d}" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="40" stroke-dasharray="9 9" stroke-linecap="butt"/>
      <path d="${d}" stroke="url(#greenhouse-path-dots)" stroke-width="34"/>
    </g>`;
}
