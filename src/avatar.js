// avatar.js — the player character, ALL in this one file:
//   the drawing (SVG), the look + walk animation (CSS), and the commands (JS).
// In your page, just add this line before your own script:
//   (a script tag with src="avatar.js")
//
// Use it like this:
//   const player = createAvatar(document.querySelector('.scene'));
//   player.moveTo(x, y);          // x, y = where the FEET are
//   player.setWalking(true);      // legs + arms animate
//   player.faceToward(dx, dy);    // turn to face the way you walk (8 directions)
//   player.hide(); player.show();

// ---------- Look + walk animation (CSS) ----------
// This CSS is added to the page automatically, so no avatar.css is needed.
const AVATAR_CSS = `
.avatar {
  position: absolute;
  width: 34px;
  height: 46px;
  z-index: 2;                 /* walks on top of paths */
  pointer-events: none;
  transition: opacity 0.2s;
}
.avatar svg { display: block; overflow: visible; }
.avatar.hidden { opacity: 0; }

/* ----- Which way the character faces: only one view shows at a time ----- */
.avatar .view { display: none; }
.avatar.face-down  .view-front,
.avatar.face-down-left  .view-front,
.avatar.face-down-right .view-front,
.avatar.face-up    .view-back,
.avatar.face-up-left    .view-back,
.avatar.face-up-right   .view-back,
.avatar.face-left  .view-side,
.avatar.face-right .view-side { display: inline; }

/* Diagonals = a 3/4 view: the face (or the back of the hair) slides toward the walking side */
.avatar .face-parts, .avatar .badge-dot, .avatar .back-hair { transition: transform 0.12s; }
.avatar.face-down-right .face-parts { transform: translateX(3px); }
.avatar.face-down-left  .face-parts { transform: translateX(-3px); }
.avatar.face-down-right .badge-dot  { transform: translateX(2px); }
.avatar.face-down-left  .badge-dot  { transform: translateX(-3px); }
.avatar.face-up-right   .back-hair  { transform: translateX(-2.5px); }
.avatar.face-up-left    .back-hair  { transform: translateX(2.5px); }

/* Facing left = the side view mirrored */
.avatar .view-side { transform-box: view-box; transform-origin: 17px 23px; }
.avatar.face-left .view-side { transform: scaleX(-1); }

/* Ground shadow under the feet (stays on the ground, shrinks a bit as the body bobs up) */
.avatar .shadow { transform-box: fill-box; transform-origin: 50% 50%; }
.avatar.walking .shadow { animation: shadowPulse 0.225s ease-in-out infinite alternate; }
@keyframes shadowPulse { to { transform: scaleX(0.85); opacity: 0.25; } }

/* Legs and arms swing from the top (hip / shoulder) */
.avatar .leg, .avatar .arm {
  transform-box: fill-box;
  transform-origin: 50% 0%;
}

/* Front + back walking: feet lift in turn, arms swing the opposite way */
.avatar.walking .leg-l { animation: liftA 0.45s ease-in-out infinite; }
.avatar.walking .leg-r { animation: liftB 0.45s ease-in-out infinite; }
.avatar.walking .arm-l { animation: swingB 0.45s ease-in-out infinite; }
.avatar.walking .arm-r { animation: swingA 0.45s ease-in-out infinite; }

/* Side walking: legs take long strides forward and back */
.avatar.walking .stride-a { animation: strideA 0.45s ease-in-out infinite; }
.avatar.walking .stride-b { animation: strideB 0.45s ease-in-out infinite; }

/* Body: bounces up on every step and sways a little side to side */
.avatar .body-bob { transform-box: view-box; transform-origin: 17px 44px; }
.avatar.walking .view-front .body-bob,
.avatar.walking .view-back  .body-bob { animation: sway 0.45s ease-in-out infinite; }
/* Side view: leans forward a little while walking */
.avatar.walking .view-side .body-bob { animation: leanBob 0.225s ease-in-out infinite alternate; }

@keyframes liftA {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3.5px); }
}
@keyframes liftB {
  0%, 100% { transform: translateY(-3.5px); }
  50%      { transform: translateY(0); }
}
@keyframes sway {
  0%, 50%, 100% { transform: translateY(0)    rotate(0deg); }
  25%           { transform: translateY(-2px) rotate(3deg); }
  75%           { transform: translateY(-2px) rotate(-3deg); }
}
@keyframes leanBob {
  from { transform: rotate(5deg) translateY(0); }
  to   { transform: rotate(5deg) translateY(-2px); }
}
@keyframes swingA {
  0%, 100% { transform: rotate(14deg); }
  50%      { transform: rotate(-14deg); }
}
@keyframes swingB {
  0%, 100% { transform: rotate(-14deg); }
  50%      { transform: rotate(14deg); }
}
@keyframes strideA {
  0%, 100% { transform: rotate(28deg); }
  50%      { transform: rotate(-28deg); }
}
@keyframes strideB {
  0%, 100% { transform: rotate(-28deg); }
  50%      { transform: rotate(28deg); }
}
`;

(function addAvatarStyles() {
  if (document.getElementById('avatar-styles')) return;   // only add once
  const style = document.createElement('style');
  style.id = 'avatar-styles';
  style.textContent = AVATAR_CSS;
  document.head.appendChild(style);
})();

// ---------- Drawing (SVG) ----------
// Colours, so they are easy to change in one place
const AVATAR_COLORS = {
  line: '#2B2A3A', skin: '#F2C49B', hair: '#3B2A22', shirt: '#5A8FE0', shirtDark: '#4777C4',
  pants: '#3A3D4A', pantsDark: '#2E303B', shoe: '#FFFFFF', badge: '#F28C3A', cheek: '#F59A9A',
};

const AVATAR_SVG = `
<svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true">

  <!-- soft shadow on the ground -->
  <ellipse class="shadow" cx="17" cy="44.5" rx="11" ry="3" fill="#000000" opacity="0.3"/>

  <!-- ===== FRONT (walking down) ===== -->
  <g class="view view-front">
    <g class="leg leg-l">
      <rect x="10" y="33" width="7" height="9" rx="2" fill="${AVATAR_COLORS.pants}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <rect x="8" y="40" width="9" height="5" rx="2.5" fill="${AVATAR_COLORS.shoe}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
    </g>
    <g class="leg leg-r">
      <rect x="17" y="33" width="7" height="9" rx="2" fill="${AVATAR_COLORS.pants}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <rect x="17" y="40" width="9" height="5" rx="2.5" fill="${AVATAR_COLORS.shoe}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
    </g>
    <g class="body-bob">
      <g class="arm arm-l">
        <rect x="3" y="22" width="6" height="13" rx="3" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
        <circle cx="6" cy="36" r="2.6" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.6"/>
      </g>
      <g class="arm arm-r">
        <rect x="25" y="22" width="6" height="13" rx="3" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
        <circle cx="28" cy="36" r="2.6" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.6"/>
      </g>
      <rect x="7" y="20" width="20" height="16" rx="6" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <g class="badge-dot"><circle cx="21.5" cy="26" r="2.6" fill="${AVATAR_COLORS.badge}" stroke="${AVATAR_COLORS.line}" stroke-width="1.4"/></g>
      <circle cx="17" cy="12" r="10" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <path d="M7.2 11 A10 10 0 0 1 26.8 11 Q17 6 7.2 11 Z" fill="${AVATAR_COLORS.hair}" stroke="${AVATAR_COLORS.line}" stroke-width="2" stroke-linejoin="round"/>
      <!-- eyes, cheeks, smile: slide sideways for the 3/4 (diagonal) view -->
      <g class="face-parts">
        <circle cx="13.5" cy="13" r="1.4" fill="${AVATAR_COLORS.line}"/>
        <circle cx="20.5" cy="13" r="1.4" fill="${AVATAR_COLORS.line}"/>
        <circle cx="11" cy="16" r="1.6" fill="${AVATAR_COLORS.cheek}" opacity="0.8"/>
        <circle cx="23" cy="16" r="1.6" fill="${AVATAR_COLORS.cheek}" opacity="0.8"/>
        <path d="M14.5 16.5 Q17 18.5 19.5 16.5" fill="none" stroke="${AVATAR_COLORS.line}" stroke-width="1.4" stroke-linecap="round"/>
      </g>
    </g>
  </g>

  <!-- ===== BACK (walking up) ===== -->
  <g class="view view-back">
    <g class="leg leg-l">
      <rect x="10" y="33" width="7" height="9" rx="2" fill="${AVATAR_COLORS.pants}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <rect x="8" y="40" width="9" height="5" rx="2.5" fill="${AVATAR_COLORS.shoe}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
    </g>
    <g class="leg leg-r">
      <rect x="17" y="33" width="7" height="9" rx="2" fill="${AVATAR_COLORS.pants}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <rect x="17" y="40" width="9" height="5" rx="2.5" fill="${AVATAR_COLORS.shoe}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
    </g>
    <g class="body-bob">
      <g class="arm arm-l">
        <rect x="3" y="22" width="6" height="13" rx="3" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
        <circle cx="6" cy="36" r="2.6" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.6"/>
      </g>
      <g class="arm arm-r">
        <rect x="25" y="22" width="6" height="13" rx="3" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
        <circle cx="28" cy="36" r="2.6" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.6"/>
      </g>
      <rect x="7" y="20" width="20" height="16" rx="6" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <!-- back of the head: mostly hair, ears show on the sides -->
      <circle cx="7.5" cy="13" r="2.2" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.6"/>
      <circle cx="26.5" cy="13" r="2.2" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.6"/>
      <!-- hair + neck: slide sideways for the 3/4 (diagonal) view -->
      <g class="back-hair">
        <circle cx="17" cy="12" r="10" fill="${AVATAR_COLORS.hair}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
        <path d="M11 19 Q17 22 23 19" fill="none" stroke="${AVATAR_COLORS.skin}" stroke-width="2" stroke-linecap="round"/>
      </g>
    </g>
  </g>

  <!-- ===== SIDE (walking right; flipped for left) ===== -->
  <g class="view view-side">
    <!-- back leg + back arm are a bit darker, so they look further away -->
    <g class="leg stride-b">
      <rect x="13.5" y="33" width="7" height="9" rx="2" fill="${AVATAR_COLORS.pantsDark}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <rect x="13.5" y="40" width="10" height="5" rx="2.5" fill="#E6E4EA" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
    </g>
    <g class="body-bob">
      <g class="arm stride-a">
        <rect x="14" y="22" width="6" height="13" rx="3" fill="${AVATAR_COLORS.shirtDark}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      </g>
    </g>
    <g class="leg stride-a">
      <rect x="13.5" y="33" width="7" height="9" rx="2" fill="${AVATAR_COLORS.pants}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <rect x="13.5" y="40" width="10" height="5" rx="2.5" fill="${AVATAR_COLORS.shoe}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
    </g>
    <g class="body-bob">
      <rect x="10" y="20" width="14" height="16" rx="6" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <g class="arm stride-b">
        <rect x="14" y="22" width="6" height="13" rx="3" fill="${AVATAR_COLORS.shirt}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
        <circle cx="17" cy="36" r="2.6" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.6"/>
      </g>
      <!-- head in profile, facing right -->
      <circle cx="17" cy="12" r="10" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="2"/>
      <path d="M7.2 13 A10 10 0 0 1 26.6 9.5 Q21 6.5 16 9 Q13 11 13.5 16 Q9 16 7.2 13 Z" fill="${AVATAR_COLORS.hair}" stroke="${AVATAR_COLORS.line}" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="14.5" cy="14" r="2" fill="${AVATAR_COLORS.skin}" stroke="${AVATAR_COLORS.line}" stroke-width="1.4"/>
      <circle cx="22.5" cy="13" r="1.4" fill="${AVATAR_COLORS.line}"/>
      <circle cx="24" cy="16.5" r="1.5" fill="${AVATAR_COLORS.cheek}" opacity="0.8"/>
      <path d="M21 17.3 Q23 18.6 25 17.3" fill="none" stroke="${AVATAR_COLORS.line}" stroke-width="1.4" stroke-linecap="round"/>
    </g>
  </g>
</svg>
`;

// ---------- Commands (JS) ----------
export function createAvatar(container) {
  // 1. Make the element and put the drawing inside
  const el = document.createElement('div');
  el.className = 'avatar face-down';
  el.innerHTML = AVATAR_SVG;
  container.appendChild(el);

  // The picture is 34 x 46. The feet are at the bottom middle.
  const FEET_X = 17;
  const FEET_Y = 44;
  let facing = 'down';

  function face(dir) {
    if (dir === facing) return;
    el.classList.remove('face-' + facing);
    el.classList.add('face-' + dir);
    facing = dir;
  }

  // 2. Commands the game can use
  return {
    el,
    moveTo(x, y) {
      el.style.left = (x - FEET_X) + 'px';
      el.style.top  = (y - FEET_Y) + 'px';
    },
    setWalking(isWalking) {
      el.classList.toggle('walking', isWalking);
    },
    // dx, dy = which way you are moving (-1, 0 or 1). 8 directions:
    //   up, down, left, right, up-left, up-right, down-left, down-right
    faceToward(dx, dy) {
      const h = dx > 0 ? 'right' : dx < 0 ? 'left' : '';
      const v = dy > 0 ? 'down'  : dy < 0 ? 'up'   : '';
      if (h && v) face(v + '-' + h);   // diagonal
      else if (h) face(h);
      else if (v) face(v);
    },
    face,                           // or set it directly, e.g. 'up', 'down-right'
    getFacing() { return facing; },
    hide() { el.classList.add('hidden'); },
    show() { el.classList.remove('hidden'); },
  };
}