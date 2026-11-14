// ICONS: one place for every icon in the game.
// Uses Lucide (free, open-source line icons: https://lucide.dev). No emoji.
// Usage inside HTML templates:  `${icon('sun')} Solar panels`
import {
  Sun, Zap, BatteryFull, BatteryLow, BatteryWarning, BatteryCharging, Tornado,
  TriangleAlert, Lightbulb, Construction, X, Moon, CircleCheck, Circle, Flag,
  SatelliteDish, Droplet, Wind, Carrot, ClipboardList, Sprout, FlaskConical,
  Brush, ArrowLeft, Lock, Gauge, Waves, Star, Shield, ShieldCheck, BedDouble, Radio, Shirt, Radiation,
} from 'lucide';

const ICONS = {
  sun: Sun,
  zap: Zap,
  'battery-full': BatteryFull,
  'battery-low': BatteryLow,
  'battery-warning': BatteryWarning,
  'battery-charging': BatteryCharging,
  tornado: Tornado,
  alert: TriangleAlert,
  lightbulb: Lightbulb,
  construction: Construction,
  close: X,
  moon: Moon,
  check: CircleCheck,
  circle: Circle,
  flag: Flag,
  satellite: SatelliteDish,
  droplet: Droplet,
  wind: Wind,
  carrot: Carrot,
  clipboard: ClipboardList,
  sprout: Sprout,
  flask: FlaskConical,
  brush: Brush,
  back: ArrowLeft,
  lock: Lock,
  gauge: Gauge,
  waves: Waves,
  star: Star,
  shield: Shield,
  'shield-check': ShieldCheck,
  bed: BedDouble,
  radio: Radio,
  shirt: Shirt,
  radiation: Radiation,
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