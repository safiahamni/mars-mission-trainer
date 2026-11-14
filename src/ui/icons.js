import {
  Sun, Zap, BatteryFull, BatteryLow, BatteryWarning, Tornado,
  TriangleAlert, Lightbulb, Construction, X,
} from 'lucide';

const ICONS = {
  sun: Sun,
  zap: Zap,
  'battery-full': BatteryFull,
  'battery-low': BatteryLow,
  'battery-warning': BatteryWarning,
  tornado: Tornado,
  alert: TriangleAlert,
  lightbulb: Lightbulb,
  construction: Construction,
  close: X,
};

// Turns a Lucide icon into an <svg> string that inherits the text colour.
export function icon(name, size = 20) {
  const node = ICONS[name];
  if (!node) return '';
  const children = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('');
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}