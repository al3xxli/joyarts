import { watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

function build() {
  execFileSync(process.execPath, ['build.mjs'], { cwd: root, stdio: 'inherit' });
}

build();
let dirty = false;
for (const input of ['src', 'media', 'public', 'build.mjs']) {
  watch(path.join(root, input), { recursive: input !== 'build.mjs' }, () => { dirty = true; });
}

const server = createServer(async (request, response) => {
  if (dirty) {
    try {
      build();
      dirty = false;
    } catch {
      response.writeHead(500).end('Build failed. Check the terminal, fix the error, then refresh.');
      return;
    }
  }

  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const segments = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    if (segments.some(part => part === '..' || /[\\:\x00]/.test(part))) {
      response.writeHead(400).end('Invalid path');
      return;
    }
    let file = path.join(dist, ...segments);
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const data = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    }).end(data);
  } catch {
    response.writeHead(404).end('Page not found');
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port ' + port + ' is already in use. Stop the other preview or set PORT.' : error.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => console.log('JoyArts preview: http://127.0.0.1:' + server.address().port + '/'));
