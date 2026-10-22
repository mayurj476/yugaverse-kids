// Shape Friends - Copyright (c) 2026 mayurj476. All rights reserved.
// Not for copying, reuse or redistribution without written permission. See LICENSE.
// Serves the game on your home network and shows the address to type on the iPad.
// Usage: node server.js   (or double-click run.bat)
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
};

// A fingerprint of the game files. The page checks it and reloads itself when anything
// changes, so the iPad never keeps running an old copy.
function gameVersion() {
  const parts = [];
  const add = (dir, rel) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isFile()) parts.push(`${rel}${name}:${st.size}:${Math.round(st.mtimeMs)}`);
    }
  };
  add(ROOT, '');
  if (fs.existsSync(path.join(ROOT, 'sounds'))) add(path.join(ROOT, 'sounds'), 'sounds/');
  let h = 0;
  for (const ch of parts.sort().join('|')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (urlPath === '/__version') {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
    return res.end(gameVersion());
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store', // always send the newest files
    });
    res.end(data);
  });
});

// Find the address the iPad can reach: real Wi-Fi/Ethernet first, virtual adapters last.
function lanAddresses() {
  const skip = /vEthernet|VirtualBox|VMware|Hyper-V|WSL|Loopback|Bluetooth|docker|ZeroTier|Tailscale|vpn/i;
  const list = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      const v4 = a.family === 'IPv4' || a.family === 4;
      if (!v4 || a.internal || a.address.startsWith('169.254.')) continue;
      let score = 0;
      if (/Wi-?Fi|Wireless|WLAN/i.test(name)) score += 3;
      else if (/Ethernet|^en|^eth/i.test(name)) score += 2;
      if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(a.address)) score += 2;
      if (skip.test(name)) score -= 10;
      list.push({ name, address: a.address, score });
    }
  }
  return list.sort((x, y) => y.score - x.score);
}

function popup(message) {
  if (process.platform !== 'win32' || process.env.NO_POPUP) return;
  const text = message.replace(/'/g, "''");
  const ps = `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${text}', 'Shape Friends - iPad address') | Out-Null`;
  spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', ps], {
    detached: true, stdio: 'ignore', windowsHide: true,
  }).unref();
}

function start(port) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < START_PORT + 20) return start(port + 1);
    console.error('Could not start the server:', err.message);
    process.exit(1);
  });
  server.listen(port, '0.0.0.0', () => {
    const addrs = lanAddresses();
    const urls = addrs.map((a) => `http://${a.address}:${port}`);
    const main = urls[0] || `http://localhost:${port}`;

    console.log('\n  ==============================================');
    console.log('   Shape Friends is running!');
    console.log('\n   On the iPad, open Safari and type:\n');
    console.log(`      ${main}\n`);
    if (urls.length > 1) {
      console.log('   If that does not open, try:');
      addrs.slice(1).forEach((a, i) => console.log(`      ${urls[i + 1]}   (${a.name})`));
      console.log('');
    }
    console.log(`   On this PC: http://localhost:${port}`);
    console.log('   Keep this window open while playing.');
    console.log('   Close it (or press Ctrl+C) to stop.');
    console.log('  ==============================================\n');

    const others = urls.length > 1 ? `\n\nIf that does not open, try:\n${urls.slice(1).join('\n')}` : '';
    popup(
      `On the iPad, open Safari and type:\n\n${main}${others}\n\n` +
      'The iPad must be on the same Wi-Fi as this PC.\n' +
      'Tip: then tap Share > Add to Home Screen to keep it as an app.\n\n' +
      'If Windows asks about the firewall, click "Allow" (Private networks).'
    );
  });
}

start(START_PORT);
