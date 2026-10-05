import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDirectory = join(root, 'data');
const dataFile = join(dataDirectory, 'bouquets.json');
const port = Number(process.env.PORT) || 4173;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

async function readBouquets() {
  try {
    return JSON.parse(await readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function saveBouquets(bouquets) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFile, JSON.stringify(bouquets, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8_000_000) throw new Error('Bouquet is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function isValidBouquet(value) {
  return value && Array.isArray(value.items) && value.items.length > 0 && value.items.length <= 12;
}

async function handleApi(request, response, pathname) {
  if (request.method === 'POST' && pathname === '/api/bouquets') {
    try {
      const bouquet = await readJson(request);
      if (!isValidBouquet(bouquet)) return sendJson(response, 400, { error: 'Add at least one flower.' });
      const bouquets = await readBouquets();
      const id = randomUUID().replaceAll('-', '').slice(0, 12);
      bouquets[id] = { ...bouquet, id, createdAt: new Date().toISOString() };
      await saveBouquets(bouquets);
      return sendJson(response, 201, { id });
    } catch (error) {
      return sendJson(response, 400, { error: error.message || 'Could not save this bouquet.' });
    }
  }

  const match = pathname.match(/^\/api\/bouquets\/([a-z0-9]+)$/i);
  if (request.method === 'GET' && match) {
    const bouquet = (await readBouquets())[match[1]];
    return bouquet
      ? sendJson(response, 200, bouquet)
      : sendJson(response, 404, { error: 'This bouquet could not be found.' });
  }

  return false;
}

async function serveFile(response, pathname) {
  const routeToApp = pathname === '/' || pathname.startsWith('/bouquet/');
  const requestedPath = routeToApp ? 'index.html' : pathname.slice(1);
  const filePath = normalize(join(root, requestedPath));
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(content);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error);
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    const handled = await handleApi(request, response, url.pathname);
    if (handled !== false) return;
  }
  await serveFile(response, url.pathname);
}).listen(port, () => {
  console.log(`A Bouquet of Things is growing at http://localhost:${port}`);
});