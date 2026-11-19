// Captures screenshots/ from the real running app: serves app/ with serve.ts,
// opens each scene from shots.json in headless Chrome, waits for the app to
// paint it (window.__shotReady), and saves the canvas (for covers) or the page
// (for the editor) as a JPEG inside the gate's caps (<= 256 KiB, long side
// <= 1280, short side >= 480), lowering quality until the size fits.
// Run: node capture.cjs
const puppeteer = require('/home/hatch/workspace/makefun/radar-tools/node_modules/puppeteer');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = 8137;
const MAX_BYTES = 256 * 1024;

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not start');
}

(async () => {
  const server = spawn('node', ['serve.ts', '--port', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  try {
    await waitForServer();
    const shots = JSON.parse(fs.readFileSync(path.join(ROOT, 'shots.json'), 'utf8'));
    fs.mkdirSync(path.join(ROOT, 'screenshots'), { recursive: true });
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    try {
      for (const shot of shots) {
        const page = await browser.newPage();
        await page.setViewport({ width: shot.view.w, height: shot.view.h, deviceScaleFactor: 1 });
        await page.goto(`http://127.0.0.1:${PORT}/${shot.query}`, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
        const target = shot.canvas ? await page.$('#stage') : page;
        const out = path.join(ROOT, 'screenshots', shot.name);
        for (const quality of [88, 82, 76, 70, 62]) {
          if (shot.canvas) await target.screenshot({ path: out, type: 'jpeg', quality });
          else await target.screenshot({ path: out, type: 'jpeg', quality });
          if (fs.statSync(out).size <= MAX_BYTES) break;
        }
        console.log('captured', shot.name, fs.statSync(out).size, 'bytes');
        await page.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.kill();
  }
})();
