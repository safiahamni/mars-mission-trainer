// mars-scenery.js — the map background and layout (shared map extras, by Member 3).
//   • real Mars ground: a layered mesa, a few craters, sand dunes (ripples) and rover wheel tracks
//   • the CLIFF ZONE (canyon shade) and CLEAR ZONE (no shade) marked on the map
//   • mars-scenery.css also hides the arrow buttons and the mission text box (keyboard: arrows / WASD)
// Everything is drawn UNDER the roads and buildings (it is only the ground). Look: mars-scenery.css.
// Needs only the map (src/map/map.js). Loaded in src/main.js; its CSS is linked in index.html.
// Uses the same "design numbers" as main.js (the big map group is scaled 1.6x).

(function () {
  const art = document.getElementById('mm-roads').parentNode;     // the big map group

  // a crater: raised light rim, dark bowl, a shadow inside
  const crater = (x, y, r) => `
  <g class="sc-crater" transform="translate(${x} ${y})">
    <ellipse rx="${r * 1.14}" ry="${r * 1.04}" fill="#D9774A"/>
    <ellipse rx="${r}" ry="${r * 0.9}" fill="#A9471F" stroke="#2B2A3A" stroke-width="2"/>
    <ellipse cx="${-r * 0.14}" cy="${-r * 0.12}" rx="${r * 0.72}" ry="${r * 0.6}" fill="#8E3518"/>
    <path d="M${r * 0.55} ${r * 0.45} A${r * 0.8} ${r * 0.7} 0 0 1 ${-r * 0.4} ${r * 0.72}" fill="none" stroke="#E8956A" stroke-width="2" stroke-linecap="round"/>
  </g>`;
  // sand dunes: a few wavy ripple lines
  const dunes = (x, y, w, rows) => {
    let d = '';
    for (let i = 0; i < rows; i++) {
      const yy = y + i * 9, xx = x + (i % 2) * 8;
      d += `M${xx} ${yy} q${w / 8} -6 ${w / 4} 0 t${w / 4} 0 t${w / 4} 0 t${w / 4} 0 `;
    }
    return `<path class="sc-dunes" d="${d}"/>`;
  };
  // a mesa seen from above: rough rocky edges, stepped rock layers, shadow on the far side,
  // gullies down the slopes, a flat cracked top and fallen boulders around the base
  function mesa(cx, cy) {
    const rnd = (i, k) => Math.sin(i * 12.9898 + k * 78.233) * 43758.5453 % 1;             // fixed "random" (same every time)
    const ring = (rx, ry, jag, k, dx = 0, dy = 0) => {                                       // a bumpy closed outline
      const n = 34, pts = [];
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, wob = 1 + Math.abs(rnd(i, k)) * jag - jag / 2 + 0.06 * Math.sin(a * 3 + k);
        pts.push(`${(cx + dx + Math.cos(a) * rx * wob).toFixed(1)} ${(cy + dy + Math.sin(a) * ry * wob).toFixed(1)}`);
      }
      return 'M' + pts.join(' L') + ' Z';
    };
    let out = `<path d="${ring(82, 43, 0.16, 9, 9, 8)}" fill="rgba(60, 20, 10, 0.3)"/>`;           // shadow (sun from top-left)
    out += `<path d="${ring(86, 45, 0.24, 7, 2, 2)}" fill="#B35A35" opacity="0.6"/>`;                // loose rock at the foot (talus)
    out += `<path d="${ring(76, 39, 0.12, 1)}" fill="#8E3518" stroke="#2B2A3A" stroke-width="2" stroke-linejoin="round"/>`;   // cliff base
    out += `<path d="${ring(71, 35, 0.12, 2, -2, -2)}" fill="#A1431E"/>`;                            // rock layer (terrace)
    out += `<path d="${ring(66, 32, 0.1, 3, -3, -3)}" fill="#B4512A"/>`;                             // rock layer (terrace)
    // gullies: short lines down the steep cliff band only (darker on the shadow side)
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2 + 0.1, shadow = Math.cos(a - 0.8) > 0;
      const r1 = 0.82, r2 = 0.97 + Math.abs(rnd(i, 4)) * 0.03;
      out += `<path d="M${(cx - 3 + Math.cos(a) * 64 * r1 / 0.82).toFixed(1)} ${(cy - 3 + Math.sin(a) * 31 * r1 / 0.82).toFixed(1)} L${(cx + Math.cos(a) * 76 * r2).toFixed(1)} ${(cy + Math.sin(a) * 39 * r2).toFixed(1)}"
        stroke="${shadow ? '#5E2210' : '#D9774A'}" stroke-width="1.3" stroke-linecap="round" opacity="0.6"/>`;
    }
    // the big flat top (most of the mesa) with sandy patches, a small crater and cracks
    out += `<path d="${ring(60, 28, 0.1, 6, -4, -4)}" fill="#D9774A" stroke="#2B2A3A" stroke-width="1.4" stroke-linejoin="round"/>`;
    out += `<path d="${ring(58, 26, 0.1, 6, -5, -5)}" fill="none" stroke="#F0A57A" stroke-width="2" stroke-dasharray="0 150 70 400" stroke-linecap="round"/>`;   // sunny edge
    out += `<ellipse cx="${cx - 22}" cy="${cy - 8}" rx="16" ry="6" fill="#E3895C"/><ellipse cx="${cx + 18}" cy="${cy + 2}" rx="12" ry="5" fill="#E3895C"/>`;
    out += `<ellipse cx="${cx + 26}" cy="${cy - 12}" rx="5" ry="3.4" fill="#B4512A" stroke="#8E3518" stroke-width="1"/>`;
    out += `<path d="M${cx - 30} ${cy + 6} l9 2 l6 -3 l7 2 M${cx - 2} ${cy - 14} l6 4 l7 -1" fill="none" stroke="#B4512A" stroke-width="1.2" stroke-linecap="round"/>`;
    // fallen boulders around the base
    [[-82, 8, 3.2], [-74, 24, 2.4], [72, 30, 3.4], [84, 14, 2.6], [32, 46, 2.8], [-30, 44, 2.2], [56, -32, 2.2], [-50, -34, 1.8], [10, 48, 2]]
      .forEach(([x, y, r]) => { out += `<circle cx="${cx + x}" cy="${cy + y}" r="${r}" fill="#7A2C14" stroke="#2B2A3A" stroke-width="1"/>`; });
    return `<g class="sc-mesa">${out}</g>`;
  }

  art.insertAdjacentHTML('afterbegin', `
<g id="sc-scenery" aria-hidden="true">
  <!-- layered mesa (flat-topped hill with rock layers), top-left corner -->
  ${mesa(22, 38)}

  <!-- craters -->
  ${crater(118, 168, 20)}
  ${crater(640, 396, 16)}
  ${crater(452, 352, 12)}

  <!-- sand dunes -->
  ${dunes(10, 104, 96, 4)}
  ${dunes(560, 270, 92, 3)}

  <!-- rover wheel tracks (two lines of little tread marks) -->
  <g class="sc-tracks">
    <path d="M-56 252 C10 236 60 246 96 222 C120 206 150 204 186 210"/>
    <path d="M-56 262 C10 246 62 256 100 232 C124 216 152 214 186 220"/>
  </g>

</g>`);

  // ================= CLIFF ZONE + CLEAR ZONE (the canyon gives shade, the open path does not) =================
  document.getElementById('sc-scenery').insertAdjacentHTML('afterend', `
<g id="sc-zones" aria-hidden="true">
  <!-- cliff zone: around the canyon between the two cliff walls -->
  <rect class="sc-zone-cliff" x="284" y="76" width="134" height="72" rx="30" transform="rotate(-45 351 111)"/>
  <!-- clear zone: a dashed outline around the open stretch of the normal path (it bends with the road) -->
  <path class="sc-zone-clear" d="M355.4 230.8 L360.0 230.9 L364.4 231.0 L368.8 231.0 L374.3 231.0 L378.7 230.9 L383.1 230.8 L387.5 230.6 L391.9 230.4 L396.3 230.1 L400.6 229.8 L405.0 229.4 L409.4 229.0 L413.8 228.5 L418.2 228.0 L422.5 227.4 L426.9 226.8 L431.3 226.1 L435.6 225.4 L439.9 224.6 L444.2 223.8 L448.5 222.9 L452.8 222.0 L457.1 221.0 L461.3 220.0 L465.3 219.0 A26 26 0 0 0 452.6 168.6 L448.8 169.5 L445.2 170.4 L441.6 171.2 L437.9 172.0 L434.2 172.8 L430.5 173.5 L426.8 174.1 L423.0 174.8 L419.3 175.3 L415.5 175.9 L411.7 176.4 L407.9 176.8 L404.1 177.2 L400.3 177.6 L396.5 177.9 L392.7 178.2 L388.9 178.5 L385.1 178.7 L381.3 178.8 L377.5 178.9 L373.8 179.0 L368.8 179.0 L365.0 179.0 L361.3 178.9 L357.0 178.8 A26 26 0 0 0 355.4 230.8 Z"/>
</g>`);
  art.insertAdjacentHTML('beforeend', `
<g id="sc-zone-tags" aria-hidden="true">
  <g transform="translate(226 104)">
    <rect x="-52" y="-11" width="104" height="30" rx="8" fill="#4B3A78" stroke="#2B2A3A" stroke-width="2"/>
    <text y="2" font-size="10" text-anchor="middle" fill="#FFFFFF">⛰ CLIFF ZONE</text>
    <text y="14" font-size="8" text-anchor="middle" fill="#D9CCFF">shade · −10% radiation</text>
  </g>
  <g transform="translate(500 232)">
    <rect x="-52" y="-11" width="104" height="30" rx="8" fill="#FFD84A" stroke="#2B2A3A" stroke-width="2"/>
    <text y="2" font-size="10" text-anchor="middle" fill="#2B2A3A">☀ CLEAR ZONE</text>
    <text y="14" font-size="8" text-anchor="middle" fill="#5E4A00">no shade · full radiation</text>
  </g>
</g>`);


  // ================= HINT CARD (the mission text, now in the left panel) =================
  // mars-scenery.css hides the side box with the mission text, so we show the same text in a card under the panel:
  // whatever any place writes with MarsMap.status(...) appears in this line.
  const statusEl = document.getElementById('mm-status');
  const hint = document.createElement('div');
  hint.className = 'sc-hint';
  hint.setAttribute('aria-hidden', 'true');            // the original (hidden) status box still speaks to screen readers
  document.getElementById('mm-topbar').appendChild(hint);
  // keep it as the LAST card, even when other places add their cards later
  new MutationObserver(() => { if (hint.nextSibling) hint.parentNode.appendChild(hint); })
    .observe(hint.parentNode, { childList: true });
  const copy = () => { hint.textContent = statusEl.textContent.trim(); hint.hidden = !hint.textContent; };
  new MutationObserver(copy).observe(statusEl, { childList: true, characterData: true, subtree: true });
  copy();
})();
