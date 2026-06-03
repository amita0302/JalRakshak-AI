// ===== MODULE 7: TRACTOR GPS MOVEMENT IQ =====

let tractorCtx, heatCtx;
let tractorPath = [];
let tractorAnimFrame = null;

function initTractorCanvas() {
  const tc = document.getElementById('tractorCanvas');
  const hc = document.getElementById('heatmapCanvas');
  if (!tc || !hc) return;
  tractorCtx = tc.getContext('2d');
  heatCtx = hc.getContext('2d');
  drawEmptyFarm();
  drawEmptyHeatmap();
}

function drawEmptyFarm() {
  if (!tractorCtx) return;
  const w = 350, h = 300;
  tractorCtx.fillStyle = '#091410';
  tractorCtx.fillRect(0, 0, w, h);
  tractorCtx.strokeStyle = 'rgba(0,255,136,0.1)';
  tractorCtx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 30) {
    tractorCtx.beginPath(); tractorCtx.moveTo(x, 0); tractorCtx.lineTo(x, h); tractorCtx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    tractorCtx.beginPath(); tractorCtx.moveTo(0, y); tractorCtx.lineTo(w, y); tractorCtx.stroke();
  }
  tractorCtx.font = '11px JetBrains Mono';
  tractorCtx.fillStyle = 'rgba(0,255,136,0.3)';
  tractorCtx.fillText('Farm Field (GPS View)', 90, h / 2);
}

function drawEmptyHeatmap() {
  if (!heatCtx) return;
  const w = 350, h = 300;
  heatCtx.fillStyle = '#091410';
  heatCtx.fillRect(0, 0, w, h);
  heatCtx.font = '11px JetBrains Mono';
  heatCtx.fillStyle = 'rgba(255,124,56,0.3)';
  heatCtx.fillText('Run tractor to generate map', 70, h / 2);
}

function simulateTractorPath() {
  tractorPath = [];
  if (tractorAnimFrame) cancelAnimationFrame(tractorAnimFrame);

  const w = 350, h = 300;
  for (let row = 0; row < 8; row++) {
    const y = 30 + row * 33;
    const leftToRight = row % 2 === 0;
    for (let x = 0; x <= 30; x++) {
      tractorPath.push({
        x: leftToRight ? (x / 30) * (w - 40) + 20 : (w - 40) - (x / 30) * (w - 40) + 20,
        y: y,
        bump: randomInRange(0, 1),
        hardness: randomInRange(0.2, 1.0)
      });
    }
  }

  drawEmptyFarm();
  animateTractor(0);
}

function animateTractor(idx) {
  if (idx >= tractorPath.length) {
    generateHeatmap();
    return;
  }

  const point = tractorPath[idx];

  if (idx % 5 === 0) {
    drawEmptyFarm();
    tractorCtx.strokeStyle = 'rgba(255, 124, 56, 0.4)';
    tractorCtx.lineWidth = 2;
    tractorCtx.beginPath();
    tractorPath.slice(0, idx).forEach((p, i) => {
      if (i === 0) tractorCtx.moveTo(p.x, p.y);
      else tractorCtx.lineTo(p.x, p.y);
    });
    tractorCtx.stroke();
    tractorCtx.font = '18px serif';
    tractorCtx.fillText('🚜', point.x - 10, point.y + 6);
  }

  tractorAnimFrame = requestAnimationFrame(() => animateTractor(idx + 1));
}

function generateHeatmap() {
  if (!heatCtx) return;
  const w = 350, h = 300;
  heatCtx.clearRect(0, 0, w, h);
  heatCtx.fillStyle = '#091410';
  heatCtx.fillRect(0, 0, w, h);

  tractorPath.forEach(point => {
    const dryness = point.bump * 0.6 + (1 - point.hardness) * 0.4;
    const r = Math.round(255 * dryness);
    const g = Math.round(200 * (1 - dryness));
    heatCtx.beginPath();
    heatCtx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    const grad = heatCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 8);
    grad.addColorStop(0, `rgba(${r},${g},0,0.8)`);
    grad.addColorStop(1, `rgba(${r},${g},0,0)`);
    heatCtx.fillStyle = grad;
    heatCtx.fill();
  });

  const dryZones = tractorPath.filter(p => p.bump > 0.7 || p.hardness < 0.3).slice(0, 3);
  dryZones.forEach((zone, i) => {
    heatCtx.beginPath();
    heatCtx.arc(zone.x, zone.y, 15, 0, Math.PI * 2);
    heatCtx.strokeStyle = '#ff3d5a';
    heatCtx.lineWidth = 2;
    heatCtx.stroke();
    heatCtx.font = '10px JetBrains Mono';
    heatCtx.fillStyle = '#ff3d5a';
    heatCtx.fillText(`DRY-${i + 1}`, zone.x - 15, zone.y - 18);
  });

  document.getElementById('tractorRec').innerHTML =
    `✅ <strong>Soil map complete!</strong><br><br>` +
    `🔴 ${dryZones.length} dry zones detected (marked in red)<br>` +
    `💧 Recommend drip irrigation to zones DRY-1 through DRY-${dryZones.length}<br>` +
    `📊 Avg soil hardness: ${(tractorPath.reduce((a, b) => a + b.hardness, 0) / tractorPath.length * 100).toFixed(0)}%<br>` +
    `⚡ Water savings vs uniform irrigation: ~28%`;
}
