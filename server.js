/* ==========================================================================
   Tiny static file server for Heroku (no dependencies).
   Serves index.html, style.css, script.js and /images.
   Run locally with:  npm start   →  http://localhost:3000
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000; // Heroku sets PORT automatically
const ROOT = __dirname;

// Only these files/folders are public (keeps server.js, package.json etc. private)
const PUBLIC = ['index.html', 'style.css', 'script.js', 'images'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

  // Redirect http → https (Heroku terminates SSL and sets this header)
  if (req.headers['x-forwarded-proto'] === 'http') {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    return res.end();
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, 'Bad request');
  }
  if (urlPath === '/') urlPath = '/index.html';

  // Resolve safely inside ROOT and only allow the public files above
  const filePath = path.normalize(path.join(ROOT, urlPath));
  const top = path.relative(ROOT, filePath).split(path.sep)[0];
  if (!filePath.startsWith(ROOT + path.sep) || !PUBLIC.includes(top)) {
    return serveIndex(res, 404);
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return serveIndex(res, 404);

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      // HTML always fresh; CSS/JS/images cached for a day
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

// Unknown URLs fall back to the one-page site
function serveIndex(res, status) {
  fs.readFile(path.join(ROOT, 'index.html'), (err, html) => {
    if (err) return send(res, 500, 'Server error');
    send(res, status, html, TYPES['.html']);
  });
}

server.listen(PORT, () => console.log(`One Stop Tech Solutions running on port ${PORT}`));
