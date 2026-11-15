// Character artwork, walking animation, and controls stay together here.
const COLORS = {
  line: "#2B2A3A", skin: "#F2C49B", hair: "#3B2A22", shirt: "#5A8FE0",
  shirtDark: "#4777C4", pants: "#3A3D4A", pantsDark: "#2E303B",
  shoe: "#FFFFFF", badge: "#F28C3A", cheek: "#F59A9A",
};

const AVATAR_CSS = `
.avatar{position:absolute;width:34px;height:46px;z-index:6;pointer-events:none;transition:opacity .2s;transform:translateZ(0)}
.avatar svg{display:block;overflow:visible}.avatar.hidden{opacity:0}.avatar .view{display:none}
.avatar.face-down .view-front,.avatar.face-down-left .view-front,.avatar.face-down-right .view-front,
.avatar.face-up .view-back,.avatar.face-up-left .view-back,.avatar.face-up-right .view-back,
.avatar.face-left .view-side,.avatar.face-right .view-side{display:inline}
.avatar .face-parts,.avatar .badge-dot,.avatar .back-hair{transition:transform .12s}
.avatar.face-down-right .face-parts{transform:translateX(3px)}.avatar.face-down-left .face-parts{transform:translateX(-3px)}
.avatar.face-down-right .badge-dot{transform:translateX(2px)}.avatar.face-down-left .badge-dot{transform:translateX(-3px)}
.avatar.face-up-right .back-hair{transform:translateX(-2.5px)}.avatar.face-up-left .back-hair{transform:translateX(2.5px)}
.avatar .view-side{transform-box:view-box;transform-origin:17px 23px}.avatar.face-left .view-side{transform:scaleX(-1)}
.avatar .shadow{transform-box:fill-box;transform-origin:50% 50%}.avatar.walking .shadow{animation:avatarShadow .225s ease-in-out infinite alternate}
.avatar .leg,.avatar .arm{transform-box:fill-box;transform-origin:50% 0%}
.avatar.walking .view-front .leg-l,.avatar.walking .view-back .leg-l{animation:avatarLiftA .45s ease-in-out infinite}
.avatar.walking .view-front .leg-r,.avatar.walking .view-back .leg-r{animation:avatarLiftB .45s ease-in-out infinite}
.avatar.walking .view-front .arm-l,.avatar.walking .view-back .arm-l{animation:avatarSwingB .45s ease-in-out infinite}
.avatar.walking .view-front .arm-r,.avatar.walking .view-back .arm-r{animation:avatarSwingA .45s ease-in-out infinite}
.avatar.walking .stride-a{animation:avatarStrideA .45s ease-in-out infinite}.avatar.walking .stride-b{animation:avatarStrideB .45s ease-in-out infinite}
.avatar .body-bob{transform-box:view-box;transform-origin:17px 44px}
.avatar.walking .view-front .body-bob,.avatar.walking .view-back .body-bob{animation:avatarSway .45s ease-in-out infinite}
.avatar.walking .view-side .body-bob{animation:avatarLean .225s ease-in-out infinite alternate}
@keyframes avatarShadow{to{transform:scaleX(.85);opacity:.25}}
@keyframes avatarLiftA{0%,100%{transform:translateY(0)}50%{transform:translateY(-3.5px)}}
@keyframes avatarLiftB{0%,100%{transform:translateY(-3.5px)}50%{transform:translateY(0)}}
@keyframes avatarSway{0%,50%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-2px) rotate(3deg)}75%{transform:translateY(-2px) rotate(-3deg)}}
@keyframes avatarLean{from{transform:rotate(5deg) translateY(0)}to{transform:rotate(5deg) translateY(-2px)}}
@keyframes avatarSwingA{0%,100%{transform:rotate(14deg)}50%{transform:rotate(-14deg)}}
@keyframes avatarSwingB{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
@keyframes avatarStrideA{0%,100%{transform:rotate(28deg)}50%{transform:rotate(-28deg)}}
@keyframes avatarStrideB{0%,100%{transform:rotate(-28deg)}50%{transform:rotate(28deg)}}`;

function addAvatarStyles() {
  if (document.getElementById("greenhouse-avatar-styles")) return;
  const style = document.createElement("style");
  style.id = "greenhouse-avatar-styles";
  style.textContent = AVATAR_CSS;
  document.head.appendChild(style);
}

function avatarSvg() {
  const c = COLORS;
  const leg = (x, cls) => `<g class="leg ${cls}"><rect x="${x}" y="33" width="7" height="9" rx="2" fill="${c.pants}" stroke="${c.line}" stroke-width="2"/><rect x="${x-2}" y="40" width="9" height="5" rx="2.5" fill="${c.shoe}" stroke="${c.line}" stroke-width="2"/></g>`;
  const arm = (x, cls) => `<g class="arm ${cls}"><rect x="${x}" y="22" width="6" height="13" rx="3" fill="${c.shirt}" stroke="${c.line}" stroke-width="2"/><circle cx="${x+3}" cy="36" r="2.6" fill="${c.skin}" stroke="${c.line}" stroke-width="1.6"/></g>`;
  const body = (rear = false) => `<g class="body-bob">${arm(3,"arm-l")}${arm(25,"arm-r")}<rect x="7" y="20" width="20" height="16" rx="6" fill="${c.shirt}" stroke="${c.line}" stroke-width="2"/><g class="badge-dot"><circle cx="21.5" cy="26" r="2.6" fill="${c.badge}" stroke="${c.line}" stroke-width="1.4"/></g>${rear?`<circle cx="7.5" cy="13" r="2.2" fill="${c.skin}" stroke="${c.line}" stroke-width="1.6"/><circle cx="26.5" cy="13" r="2.2" fill="${c.skin}" stroke="${c.line}" stroke-width="1.6"/><g class="back-hair"><circle cx="17" cy="12" r="10" fill="${c.hair}" stroke="${c.line}" stroke-width="2"/><path d="M11 19 Q17 22 23 19" fill="none" stroke="${c.skin}" stroke-width="2" stroke-linecap="round"/></g>`:`<circle cx="17" cy="12" r="10" fill="${c.skin}" stroke="${c.line}" stroke-width="2"/><path d="M7.2 11 A10 10 0 0 1 26.8 11 Q17 6 7.2 11 Z" fill="${c.hair}" stroke="${c.line}" stroke-width="2" stroke-linejoin="round"/><g class="face-parts"><circle cx="13.5" cy="13" r="1.4" fill="${c.line}"/><circle cx="20.5" cy="13" r="1.4" fill="${c.line}"/><circle cx="11" cy="16" r="1.6" fill="${c.cheek}"/><circle cx="23" cy="16" r="1.6" fill="${c.cheek}"/><path d="M14.5 16.5 Q17 18.5 19.5 16.5" fill="none" stroke="${c.line}" stroke-width="1.4" stroke-linecap="round"/></g>`}</g>`;
  return `<svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true"><ellipse class="shadow" cx="17" cy="44.5" rx="11" ry="3" fill="#000" opacity=".3"/><g class="view view-front">${leg(10,"leg-l")}${leg(17,"leg-r")}${body(false)}</g><g class="view view-back">${leg(10,"leg-l")}${leg(17,"leg-r")}${body(true)}</g><g class="view view-side"><g class="leg stride-b"><rect x="13.5" y="33" width="7" height="9" rx="2" fill="${c.pantsDark}" stroke="${c.line}" stroke-width="2"/><rect x="13.5" y="40" width="10" height="5" rx="2.5" fill="#E6E4EA" stroke="${c.line}" stroke-width="2"/></g><g class="body-bob"><g class="arm stride-a"><rect x="14" y="22" width="6" height="13" rx="3" fill="${c.shirtDark}" stroke="${c.line}" stroke-width="2"/></g></g><g class="leg stride-a"><rect x="13.5" y="33" width="7" height="9" rx="2" fill="${c.pants}" stroke="${c.line}" stroke-width="2"/><rect x="13.5" y="40" width="10" height="5" rx="2.5" fill="${c.shoe}" stroke="${c.line}" stroke-width="2"/></g><g class="body-bob"><rect x="10" y="20" width="14" height="16" rx="6" fill="${c.shirt}" stroke="${c.line}" stroke-width="2"/><g class="arm stride-b"><rect x="14" y="22" width="6" height="13" rx="3" fill="${c.shirt}" stroke="${c.line}" stroke-width="2"/><circle cx="17" cy="36" r="2.6" fill="${c.skin}" stroke="${c.line}" stroke-width="1.6"/></g><circle cx="17" cy="12" r="10" fill="${c.skin}" stroke="${c.line}" stroke-width="2"/><path d="M7.2 13 A10 10 0 0 1 26.6 9.5 Q21 6.5 16 9 Q13 11 13.5 16 Q9 16 7.2 13 Z" fill="${c.hair}" stroke="${c.line}" stroke-width="2"/><circle cx="22.5" cy="13" r="1.4" fill="${c.line}"/><circle cx="24" cy="16.5" r="1.5" fill="${c.cheek}"/><path d="M21 17.3 Q23 18.6 25 17.3" fill="none" stroke="${c.line}" stroke-width="1.4" stroke-linecap="round"/></g></g></svg>`;
}

/** Create an animated player; x and y passed to moveTo are the foot position. */
export function createAvatar(container) {
  if (!container) throw new TypeError("An avatar container is required.");
  addAvatarStyles();
  const el = document.createElement("div");
  el.className = "avatar face-down";
  el.innerHTML = avatarSvg();
  container.appendChild(el);
  const FEET_X = 17;
  const FEET_Y = 44;
  let facing = "down";

  function face(direction) {
    if (!["up", "down", "left", "right", "up-left", "up-right", "down-left", "down-right"].includes(direction)) return;
    el.classList.remove(`face-${facing}`);
    el.classList.add(`face-${direction}`);
    facing = direction;
  }

  return {
    el,
    moveTo(x, y) { el.style.left = `${x-FEET_X}px`; el.style.top = `${y-FEET_Y}px`; },
    setWalking(isWalking) { el.classList.toggle("walking", Boolean(isWalking)); },
    faceToward(dx, dy) {
      const h = dx > 0 ? "right" : dx < 0 ? "left" : "";
      const v = dy > 0 ? "down" : dy < 0 ? "up" : "";
      if (h && v) face(`${v}-${h}`); else if (h || v) face(h || v);
    },
    face,
    getFacing() { return facing; },
    hide() { el.classList.add("hidden"); },
    show() { el.classList.remove("hidden"); },
  };
}
