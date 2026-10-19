import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd(), port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    // Also serve at the eventual GitHub Pages subdirectory for path verification.
    let pathname = decodeURIComponent(url.pathname).replace(/^\/physics-interactive-lab(?=\/|$)/, '') || '/';
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) throw new Error('Outside root');
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Physics lab: http://127.0.0.1:${port}/physics-interactive-lab/`));
