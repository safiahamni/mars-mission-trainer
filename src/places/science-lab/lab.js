import labArtwork from './lab-map.png';

// Older map builds do not yet include the shared mission clock.
const clockStores = import.meta.glob('../../state/gameStore.js', {
  eager: true,
  import: 'pauseClock'
});
const pauseClock = clockStores['../../state/gameStore.js'];

const map = window.MarsMap;
const labSpot = document.querySelector('#place-lab .mm-spot');
if (labSpot) {
  const svg = 'http://www.w3.org/2000/svg';
  const artwork = document.createElementNS(svg, 'svg');
  for (const attribute of ['x', 'y', 'width', 'height']) {
    artwork.setAttribute(attribute, labSpot.getAttribute(attribute));
  }
  artwork.setAttribute('viewBox', '167 175 1202 673');
  artwork.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  artwork.setAttribute('overflow', 'hidden');

  artwork.setAttribute('aria-hidden', 'true');
  artwork.setAttribute('pointer-events', 'none');
  const image = document.createElementNS(svg, 'image');
  image.setAttribute('href', labArtwork);
  image.setAttribute('width', '1536');
  image.setAttribute('height', '1024');
  const clip = document.createElementNS(svg, 'clipPath');
  clip.id = 'science-lab-artwork-outline';
  const outline = document.createElementNS(svg, 'rect');
  outline.setAttribute('x', '169');
  outline.setAttribute('y', '177');
  outline.setAttribute('width', '1198');
  outline.setAttribute('height', '669');
  outline.setAttribute('rx', '120');
  clip.append(outline);
  image.setAttribute('clip-path', 'url(#science-lab-artwork-outline)');
  artwork.append(clip, image);
  labSpot.after(artwork);
}

const frame = document.createElement('iframe');
frame.title = 'Science Lab';
frame.allow = 'autoplay';
frame.hidden = true;
Object.assign(frame.style, {
  position: 'fixed', inset: '0', width: '100%', height: '100%',
  border: '0', zIndex: '1000', background: '#2b2a3a'
});
document.body.append(frame);

map.on('enter', place => {
  if (place !== 'lab' || !frame.hidden) return;
  map.releaseKeys();
  map.pause(true);
  pauseClock?.(true);
  if (!frame.hasAttribute('src')) {
    const url = new URL('src/places/science-lab/index.html', document.baseURI);
    url.searchParams.set('embedded', '1');
    frame.src = url.href;
  }
  frame.hidden = false;
  frame.focus();
});

window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow
    || event.data !== 'mars-science:leave' || frame.hidden) return;
  frame.hidden = true;
  map.leave('down');
  map.releaseKeys();
  map.pause(false);
  pauseClock?.(false);
  window.focus();
});


