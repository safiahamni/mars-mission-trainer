import './style.css';
import { renderCommandCenter } from './ui/rooms/commandCenter.js';

// For now the game opens straight into the Command Center.
// The base map is being rebuilt; when it's ready it can open the Command Center as a room instead.
const root = document.createElement('div');
document.body.appendChild(root);
renderCommandCenter(root);
