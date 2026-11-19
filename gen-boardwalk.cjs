// Generates app/samples/boardwalk.jpg: a synthetic sunset scene drawn with
// canvas shapes (no photograph, no borrowed art) — sky, sun, sea, a boardwalk
// in perspective and palm silhouettes. Run: node gen-boardwalk.cjs
const puppeteer = require('/home/hatch/workspace/makefun/radar-tools/node_modules/puppeteer');
const fs = require('node:fs');
const path = require('node:path');

const SCENE = `
const canvas = document.createElement('canvas');
canvas.width = 1600; canvas.height = 1200;
const ctx = canvas.getContext('2d');
const W = 1600, H = 1200, horizon = 760;

// Sky
const sky = ctx.createLinearGradient(0, 0, 0, horizon);
sky.addColorStop(0, '#2b1055');
sky.addColorStop(0.45, '#7597de');
sky.addColorStop(0.72, '#ff7e5f');
sky.addColorStop(1, '#feb47b');
ctx.fillStyle = sky;
ctx.fillRect(0, 0, W, horizon);

// Sun with a soft glow, low over the water
const glow = ctx.createRadialGradient(800, horizon - 60, 10, 800, horizon - 60, 420);
glow.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
glow.addColorStop(0.25, 'rgba(255, 180, 90, 0.55)');
glow.addColorStop(1, 'rgba(255, 140, 80, 0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, horizon);
ctx.fillStyle = '#fff3b0';
ctx.beginPath(); ctx.arc(800, horizon - 60, 92, 0, Math.PI * 2); ctx.fill();

// Cloud bands
ctx.fillStyle = 'rgba(70, 30, 110, 0.35)';
for (const [y, hgt, off] of [[150, 26, -120], [245, 18, 260], [360, 30, -60], [470, 16, 420], [560, 22, 120]]) {
  ctx.beginPath();
  ctx.ellipse(420 + off, y, 430, hgt, 0, 0, Math.PI * 2);
  ctx.ellipse(980 + off, y + 8, 520, hgt * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
}
ctx.fillStyle = 'rgba(255, 190, 140, 0.5)';
for (const [y, off] of [[205, 60], [415, -160], [610, 240]]) {
  ctx.beginPath(); ctx.ellipse(760 + off, y, 560, 9, 0, 0, Math.PI * 2); ctx.fill();
}

// Distant skyline silhouette on the horizon
ctx.fillStyle = '#4a2560';
let x = -20;
while (x < W) {
  const bw = 40 + Math.random() * 70;
  const bh = 40 + Math.random() * 130;
  ctx.fillRect(x, horizon - bh, bw, bh);
  x += bw + 6 + Math.random() * 26;
}

// Sea
const sea = ctx.createLinearGradient(0, horizon, 0, 950);
sea.addColorStop(0, '#c94f6d');
sea.addColorStop(0.5, '#7e2a54');
sea.addColorStop(1, '#3c1a4d');
ctx.fillStyle = sea;
ctx.fillRect(0, horizon, W, 190);

// Sun glitter on the water
for (let i = 0; i < 260; i++) {
  const t = Math.random();
  const gy = horizon + 8 + t * 165;
  const spread = 60 + t * 300;
  const gx = 800 + (Math.random() - 0.5) * 2 * spread;
  ctx.fillStyle = 'rgba(255, ' + (200 + Math.random() * 55 | 0) + ', 130,' + (0.25 + Math.random() * 0.5) + ')';
  ctx.fillRect(gx, gy, 14 + Math.random() * 46 * t + 6, 2.4);
}

// Boardwalk in perspective along the bottom
ctx.fillStyle = '#5b2a3c';
ctx.beginPath();
ctx.moveTo(430, 950); ctx.lineTo(1170, 950); ctx.lineTo(1600, 1200); ctx.lineTo(0, 1200); ctx.closePath();
ctx.fill();
ctx.strokeStyle = 'rgba(255, 170, 120, 0.28)';
ctx.lineWidth = 3;
for (let i = 0; i <= 10; i++) {
  const t = i / 10;
  ctx.beginPath();
  ctx.moveTo(430 + (1170 - 430) * t, 950);
  ctx.lineTo(0 + (1600) * t, 1200);
  ctx.stroke();
}
for (let i = 1; i < 6; i++) {
  const t = i / 6;
  const y = 950 + (1200 - 950) * t * t;
  ctx.beginPath(); ctx.moveTo(430 - 430 * t * t * 1.6, y); ctx.lineTo(1170 + 430 * t * t * 1.6, y); ctx.stroke();
}

// String lights along the boardwalk rails
for (const side of [0, 1]) {
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const lx = side === 0 ? 430 - 430 * t * t * 1.6 + 14 : 1170 + 430 * t * t * 1.6 - 14;
    const ly = 950 + 250 * t * t - 26 - 10 * Math.sin(t * Math.PI);
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 12);
    g.addColorStop(0, 'rgba(255, 230, 160, 0.95)');
    g.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lx, ly, 12, 0, Math.PI * 2); ctx.fill();
  }
}

// Palm silhouettes
function palm(px, base, height, lean, flip) {
  ctx.strokeStyle = '#170a26';
  ctx.fillStyle = '#170a26';
  const topX = px + lean, topY = base - height;
  ctx.lineWidth = 17;
  ctx.beginPath();
  ctx.moveTo(px, base);
  ctx.quadraticCurveTo(px + lean * 0.3, base - height * 0.6, topX, topY);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5) * 2.4 * flip - 0.4;
    const len = height * (0.34 + Math.random() * 0.1);
    const ex = topX + Math.sin(a) * len;
    const ey = topY - Math.cos(a) * len * 0.42 + len * 0.34;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.sin(a) * len * 0.6, topY - len * 0.36, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(topX, topY + 6, 11, 0, Math.PI * 2); ctx.fill();
}
palm(215, 1010, 560, 60, 1);
palm(1420, 1030, 620, -70, -1);
palm(120, 1150, 430, 40, 1);

// Birds
ctx.strokeStyle = 'rgba(30, 10, 50, 0.8)';
ctx.lineWidth = 3.4;
for (const [bx, by, s] of [[520, 210, 15], [600, 170, 11], [1050, 250, 13], [1130, 200, 9]]) {
  ctx.beginPath();
  ctx.moveTo(bx - s, by);
  ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
  ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by);
  ctx.stroke();
}

canvas.toDataURL('image/jpeg', 0.88);
`;

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    const dataUrl = await page.evaluate(SCENE);
    const out = path.join(__dirname, 'app', 'samples', 'boardwalk.jpg');
    fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('wrote', out, fs.statSync(out).size, 'bytes');
  } finally {
    await browser.close();
  }
})();
