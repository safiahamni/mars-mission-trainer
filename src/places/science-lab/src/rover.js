export const map = [
  '###########',
  '#S..#....G#',
  '#.#.#.###.#',
  '#.B...#..C#',
  '###.#.#.###',
  '#A..#...D.#',
  '###########'
];

export const directions = {up:[0,-1], down:[0,1], left:[-1,0], right:[1,0]};

export function newRoute() {
  return {x:1, y:1, battery:false, beacons:[], finished:false};
}

export function drive(route, direction) {
  const [dx, dy] = directions[direction];
  const x = route.x + dx;
  const y = route.y + dy;
  const cell = map[y]?.[x];
  if (route.finished || !cell || cell === '#') return route;
  if (cell === 'G' && (!route.battery || route.beacons.length < 3)) return route;
  const beacons = 'BCD'.includes(cell) && !route.beacons.includes(cell)
    ? [...route.beacons, cell] : route.beacons;
  return {x, y, beacons, battery:route.battery || cell === 'A', finished:cell === 'G'};
}
