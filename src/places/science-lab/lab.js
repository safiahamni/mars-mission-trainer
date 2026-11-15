const map = window.MarsMap;
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
  if (place !== 'lab') return;
  map.releaseKeys();
  map.pause(true);
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
  window.focus();
});


