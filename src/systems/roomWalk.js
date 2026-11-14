// ROOM WALK: keeps the player on the dotted paths inside a room.
// Works the same way as walkPath.js on the base map, but for any list of lines.
//
//   const walk = makeWalker(ROOM_PATHS, ROOM_PATH_WIDTH);
//   walk.move(pos, dx, dy);   // moves, but never off the path

export function makeWalker(lines, pathWidth) {
  const half = pathWidth / 2 - 6;   // how far from the centre line the feet may go
  const boxes = lines.map(([x1, y1, x2, y2]) => ({
    x1: Math.min(x1, x2) - half, x2: Math.max(x1, x2) + half,
    y1: Math.min(y1, y2) - half, y2: Math.max(y1, y2) + half,
  }));

  function onPath(x, y) {
    return boxes.some((b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
  }

  // Corner helper: if you press up/down just next to a side path, you get nudged onto it
  // (and the same for left/right), so kids don't have to line up perfectly.
  const ASSIST = 40;
  function nudge(pos, dx, dy) {
    const step = Math.abs(dx) || Math.abs(dy);
    for (const [x1, y1, x2, y2] of lines) {
      if (dy && x1 === x2 && Math.abs(pos.x - x1) <= ASSIST && onPath(x1, pos.y + dy)) {
        return { x: pos.x + Math.sign(x1 - pos.x) * Math.min(step, Math.abs(x1 - pos.x)), y: pos.y };
      }
      if (dx && y1 === y2 && Math.abs(pos.y - y1) <= ASSIST && onPath(pos.x + dx, y1)) {
        return { x: pos.x, y: pos.y + Math.sign(y1 - pos.y) * Math.min(step, Math.abs(y1 - pos.y)) };
      }
    }
    return pos;
  }

  // move by dx, dy; slide along the edge instead of leaving the path
  function move(pos, dx, dy) {
    let next = { ...pos };
    const movedX = onPath(next.x + dx, next.y);
    if (movedX) next.x += dx;
    const movedY = onPath(next.x, next.y + dy);
    if (movedY) next.y += dy;
    if (dy && !movedY && !dx) next = nudge(next, 0, dy);
    if (dx && !movedX && !dy) next = nudge(next, dx, 0);
    return center(next, dx, dy);
  }

  // while walking along a path, drift to its middle so the player doesn't hug the edge
  function center(pos, dx, dy) {
    const step = Math.abs(dx) || Math.abs(dy);
    for (const [x1, y1, x2, y2] of lines) {
      if (dy && !dx && x1 === x2 && Math.abs(pos.x - x1) <= ASSIST
        && pos.y >= Math.min(y1, y2) && pos.y <= Math.max(y1, y2)) {
        return { x: pos.x + Math.sign(x1 - pos.x) * Math.min(step, Math.abs(x1 - pos.x)), y: pos.y };
      }
      if (dx && !dy && y1 === y2 && Math.abs(pos.y - y1) <= ASSIST
        && pos.x >= Math.min(x1, x2) && pos.x <= Math.max(x1, x2)) {
        return { x: pos.x, y: pos.y + Math.sign(y1 - pos.y) * Math.min(step, Math.abs(y1 - pos.y)) };
      }
    }
    return pos;
  }

  return { onPath, move };
}

export function isNear(pos, spot) {
  return Math.hypot(pos.x - spot.x, pos.y - spot.y) <= spot.range;
}