// OUTFITS (Member 1): crew shirt colours and the Mars spacesuit, from the Astronaut Character sheet.
// Works on top of the teammate's avatar (src/ui/avatar.js) without changing it:
//   const a = createAvatar(el);
//   dressAvatar(a, { outfit: 'suit', shirt: 'teal' });
import './outfit.css';

// see-through visor so the face still shows, white helmet, helmet lamp
const HELMET_SVG = `
<svg class="helmet" viewBox="0 0 34 46" width="34" height="46" aria-hidden="true">
  <path class="shell" fill-rule="evenodd" fill="#FBFBFD" stroke="#2B2A3A" stroke-width="2"
    d="M4.5 12 a12.5 12.5 0 1 0 25 0 a12.5 12.5 0 1 0 -25 0 Z M8 13 a9 6.5 0 1 0 18 0 a9 6.5 0 1 0 -18 0 Z"/>
  <ellipse class="visor" cx="17" cy="13" rx="9" ry="6.5" fill="#8FD3C8" fill-opacity="0.45" stroke="#2B2A3A" stroke-width="1.6"/>
  <circle class="back" cx="17" cy="12" r="12.5" fill="#FBFBFD" stroke="#2B2A3A" stroke-width="2"/>
  <circle cx="7.5" cy="3.5" r="2.2" fill="#FFD23F" stroke="#2B2A3A" stroke-width="1.2"/>
</svg>`;

export function dressAvatar(avatar, { outfit = 'crew', shirt = 'blue' } = {}) {
  const el = avatar.el;
  if (!el.querySelector('.helmet')) el.insertAdjacentHTML('beforeend', HELMET_SVG);
  el.classList.remove('shirt-blue', 'shirt-teal', 'shirt-purple', 'shirt-orange', 'shirt-red');
  el.classList.add(`shirt-${shirt}`);
  el.classList.toggle('suit', outfit === 'suit');
}