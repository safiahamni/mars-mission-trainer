// The player character is shared by the whole team and lives in src/map/avatar.js
// (it puts createAvatar on window). This tiny file lets our modules import it the normal way:
//   import { createAvatar } from '../avatar.js';
import '../map/avatar.js';

export function createAvatar(container) {
  return window.createAvatar(container);
}