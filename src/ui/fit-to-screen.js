// fit-to-screen.js — makes a room page fit the screen with NO scrolling.
// Used by the Science Lab and Life Support pages (they open full-screen inside the game).
// If the page is taller (or wider) than the window, the whole page is shrunk just enough to fit.
// On big screens where it already fits, nothing changes (stays 100%).
// It fits again when the window changes size or the page content changes (new panels, chapters...).

const html = document.documentElement;
const body = document.body;
let busy = false;

function fit() {
  if (busy) return;
  busy = true;
  if (html.hasAttribute('data-fit-overview')) {
    const dialogs = body.querySelectorAll('dialog[open]');
    if (dialogs.length) {
      // Keep the overview fixed and size each open dialog independently.
      const overviewScale = Number(body.style.zoom) || 1;
      for (const dialog of dialogs) {
        dialog.style.zoom = String(1 / overviewScale);
        if (dialog.id === 'mission') continue; // Rover Rescue uses a full-screen playfield.
        const neededHeight = dialog.scrollHeight + dialog.offsetHeight - dialog.clientHeight;
        const fit = Math.max(.72, Math.min(1, (innerHeight - 24) / Math.max(1, neededHeight)));
        dialog.style.zoom = String(fit / overviewScale);
      }
      html.style.overflow = 'hidden';
      busy = false;
      return;
    }
  }
  body.style.zoom = '';                                   // measure the page at its real size
  const needH = html.scrollHeight, needW = html.scrollWidth;
  const z = Math.min(1, innerHeight / needH, innerWidth / needW);
  if (z < 1) body.style.zoom = String(Math.max(0.5, Math.floor(z * 1000) / 1000));
  html.style.overflow = 'hidden';                         // no scroll bars
  requestAnimationFrame(() => { busy = false; });
}

let queued = false;
function fitSoon() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; fit(); });
}

addEventListener('resize', fitSoon);
addEventListener('load', fitSoon);
new MutationObserver(fitSoon).observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'open'] });
fit();
