import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';

const routes = new Map([
  ['/', ['index.html', 'text/html']],
  ['/style.css', ['style.css', 'text/css']],
  ...['app','missions','science','scienceFacts','rover','avatar'].map(name => [`/src/${name}.js`, [`src/${name}.js`, 'text/javascript']])
]);
createServer(async (request, response) => {
  const route = routes.get(request.url?.split('?')[0]);
  if (!route) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(new URL(route[0], import.meta.url));
    response.writeHead(200, {'Content-Type': route[1] + '; charset=utf-8'}).end(body);
  } catch {
    response.writeHead(500).end();
  }
}).listen(5173, '127.0.0.1', () => console.log('http://127.0.0.1:5173'));

