// ===== MODULE 5: ROOT MOISTURE SCANNER =====

function runRootScan(e) {
  const btn = e ? e.target : document.querySelector('[onclick*="runRootScan"]');
  btn.textContent = '⏳ SCANNING...';
  btn.disabled = true;

  const probe = document.getElementById('uProbe');
  if (probe) probe.style.marginTop = '0px';

  let pos = 0;
  const descend = setInterval(() => {
    pos += 2;
    if (probe) probe.style.marginTop = pos + 'px';
    if (pos >= 40) { clearInterval(descend); emitWaves(); }
  }, 30);

  setTimeout(() => {
    const readings = {
      surface: Math.round(randomInRange(15, 55)),
      mid: Math.round(randomInRange(20, 60)),
      root: Math.round(randomInRange(18, 50)),
      deep: Math.round(randomInRange(40, 80))
    };

    document.getElementById('d0').textContent = readings.surface + '% moisture';
    document.getElementById('d5').textContent = readings.mid + '% moisture';
    document.getElementById('d15').textContent = readings.root + '% moisture ← CRITICAL';
    document.getElementById('d40').textContent = readings.deep + '% moisture';
    document.getElementById('r0').textContent = readings.surface + '%';
    document.getElementById('r5').textContent = readings.mid + '%';
    document.getElementById('r15').textContent = readings.root + '% ← CRITICAL';
    document.getElementById('r40').textContent = readings.deep + '%';

    const d15El = document.getElementById('d15');
    if (d15El) d15El.style.color = readings.root < 30 ? '#ff3d5a' : readings.root < 45 ? '#f5e642' : '#00ff88';

    const rec = document.getElementById('rootRec');
    if (readings.root < 30) {
      rec.textContent = '🚨 CRITICAL: Root zone moisture critically low at ' + readings.root + '%. Immediate deep irrigation required. Use drip for 2 hours.';
      rec.style.borderColor = '#ff3d5a';
      rec.style.background = 'rgba(255,61,90,0.08)';
    } else if (readings.root < 45) {
      rec.textContent = '⚠️ Root zone at ' + readings.root + '%. Schedule irrigation in next 6 hours. 20mm water recommended.';
      rec.style.borderColor = '#f5e642';
      rec.style.background = 'rgba(245,230,66,0.08)';
    } else {
      rec.textContent = '✅ Root zone moisture adequate at ' + readings.root + '%. Next irrigation in 24–36 hours.';
      rec.style.borderColor = '#00ff88';
      rec.style.background = 'rgba(0,255,136,0.08)';
    }

    if (probe) probe.style.marginTop = '0px';
    btn.textContent = '🔊 RUN ULTRASONIC SCAN';
    btn.disabled = false;
  }, 2500);
}

function emitWaves() {
  const waves = document.getElementById('probeWaves');
  if (!waves) return;
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const w = document.createElement('div');
      w.style.cssText = `
        position:absolute; width:${20 + i * 15}px; height:${20 + i * 15}px;
        border:1px solid rgba(255,124,56,0.6); border-radius:50%;
        transform:translate(-50%,-50%);
        animation: wavePulse 1s forwards;
      `;
      waves.appendChild(w);
      setTimeout(() => w.remove(), 1000);
    }, i * 100);
  }
}

// ===== MODULE 6: DIGITAL TWIN =====

let twinCtx;

function initTwinCanvas() {
  const canvas = document.getElementById('twinCanvas');
  if (!canvas) return;
  twinCtx = canvas.getContext('2d');
  drawTwin(12);
  updateTwinStats(12);
}

function updateTwinTime(hour) {
  drawTwin(parseInt(hour));
  updateTwinStats(parseInt(hour));
}

function drawTwin(hour) {
  const canvas = document.getElementById('twinCanvas');
  if (!canvas || !twinCtx) return;
  twinCtx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width, h = canvas.height;
  const dayProgress = hour / 24;

  // Sky gradient
  const skyR = Math.round(5 + dayProgress * 20);
  const skyG = Math.round(12 + dayProgress * 15);
  const skyB = Math.round(10 + dayProgress * 8);
  twinCtx.fillStyle = `rgb(${skyR},${skyG},${skyB})`;
  twinCtx.fillRect(0, 0, w, h);

  // Sun/Moon
  const sunX = (hour / 24) * w;
  const sunY = h * 0.2 + Math.sin(dayProgress * Math.PI) * -h * 0.15;
  const isSun = hour > 6 && hour < 20;
  twinCtx.beginPath();
  twinCtx.arc(sunX, sunY, isSun ? 20 : 12, 0, Math.PI * 2);
  twinCtx.fillStyle = isSun ? '#f5e642' : '#ccc';
  if (isSun) { twinCtx.shadowColor = '#f5e642'; twinCtx.shadowBlur = 30; }
  twinCtx.fill();
  twinCtx.shadowBlur = 0;

  // Farm zones
  const zones = [
    { moisture: 60 - hour * 1.5 },
    { moisture: 45 - hour * 1.2 },
    { moisture: 70 - hour * 1.0 },
    { moisture: 55 - hour * 1.4 },
    { moisture: 40 - hour * 1.6 },
  ];

  zones.forEach((zone, i) => {
    const zx = (i / zones.length) * w;
    const zw = w / zones.length;
    const m = Math.max(10, zone.moisture);
    const hue = m > 50 ? 140 : m > 30 ? 60 : 0;
    twinCtx.fillStyle = `hsla(${hue}, 70%, 15%, 0.9)`;
    twinCtx.fillRect(zx, h * 0.65, zw - 2, h * 0.35);
    const barH = (m / 100) * h * 0.3;
    twinCtx.fillStyle = `hsla(${hue}, 80%, 40%, 0.6)`;
    twinCtx.fillRect(zx + 5, h * 0.65 + (h * 0.3 - barH), zw - 12, barH);
    twinCtx.font = '10px JetBrains Mono';
    twinCtx.fillStyle = 'rgba(255,255,255,0.6)';
    twinCtx.fillText(`Z${i + 1}: ${Math.round(m)}%`, zx + 5, h - 5);
  });

  // Plants
  for (let i = 0; i < 20; i++) {
    const px = (i / 20) * w + 15;
    const py = h * 0.63;
    const moisture = zones[Math.floor(i / 4)]?.moisture || 50;
    const health = Math.max(0.3, moisture / 80);
    const plantH = 20 + health * 25;
    twinCtx.strokeStyle = `rgba(0, ${Math.round(150 * health)}, ${Math.round(80 * health)}, 0.9)`;
    twinCtx.lineWidth = 1.5;
    twinCtx.beginPath();
    twinCtx.moveTo(px, py);
    twinCtx.lineTo(px, py - plantH);
    twinCtx.stroke();
    twinCtx.beginPath();
    twinCtx.arc(px, py - plantH, 3 * health, 0, Math.PI * 2);
    twinCtx.fillStyle = `rgba(0, ${Math.round(200 * health)}, 0, 0.8)`;
    twinCtx.fill();
  }

  twinCtx.font = 'bold 14px JetBrains Mono';
  twinCtx.fillStyle = 'rgba(0,255,136,0.8)';
  twinCtx.fillText(`${String(hour).padStart(2, '0')}:00`, w - 70, 25);
}

function updateTwinStats(hour) {
  const moisture = Math.max(15, 70 - hour * 1.3 + Math.sin(hour * 0.5) * 5);
  const evap = 0.5 + (hour > 9 && hour < 17 ? 2.5 : 0.5);
  const hoursLeft = Math.max(0, Math.round((moisture - 30) / evap));
  const waterNeeded = Math.round((60 - moisture) * 0.3 + 5);

  document.getElementById('twMoisture').textContent = Math.round(moisture) + '%';
  document.getElementById('twEvap').textContent = evap.toFixed(1) + ' mm/hr';
  document.getElementById('twNext').textContent = hoursLeft > 0 ? `In ${hoursLeft}hrs` : 'NOW!';
  document.getElementById('twWater').textContent = Math.max(0, waterNeeded) + 'L/m²';

  document.getElementById('twMoisture').style.color = moisture > 50 ? '#00ff88' : moisture > 30 ? '#f5e642' : '#ff3d5a';
  document.getElementById('twNext').style.color = hoursLeft < 2 ? '#ff3d5a' : '#c338ff';
}
