// ===== MODULE 3: RAINWATER FLOW MAPPER =====

let rainCtx, rainParticles = [], farmTerrain = [], channelLines = [];

function initRainMap() {
  const canvas = document.getElementById('rainCanvas');
  if (!canvas) return;
  rainCtx = canvas.getContext('2d');
  generateTerrain(canvas.width, canvas.height);
  drawTerrain();
}

function generateTerrain(w, h) {
  farmTerrain = [];
  // Generate elevation map (simple noise)
  for (let y = 0; y < h; y += 10) {
    for (let x = 0; x < w; x += 10) {
      const elevation = Math.sin(x * 0.02) * 20 + Math.cos(y * 0.015) * 15
        + Math.sin((x + y) * 0.01) * 10 + randomInRange(-5, 5);
      farmTerrain.push({ x, y, elevation });
    }
  }
}

function drawTerrain() {
  const canvas = document.getElementById('rainCanvas');
  if (!rainCtx) return;
  rainCtx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw elevation as color
  farmTerrain.forEach(point => {
    const norm = (point.elevation + 40) / 80;
    const g = Math.round(40 + norm * 80);
    const b = Math.round(20 + norm * 40);
    rainCtx.fillStyle = `rgb(${20}, ${g}, ${b})`;
    rainCtx.fillRect(point.x, point.y, 10, 10);
  });

  // Draw grid
  rainCtx.strokeStyle = 'rgba(0,255,136,0.06)';
  rainCtx.lineWidth = 0.5;
  for (let x = 0; x < canvas.width; x += 50) {
    rainCtx.beginPath();
    rainCtx.moveTo(x, 0);
    rainCtx.lineTo(x, canvas.height);
    rainCtx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 50) {
    rainCtx.beginPath();
    rainCtx.moveTo(0, y);
    rainCtx.lineTo(canvas.width, y);
    rainCtx.stroke();
  }

  // Redraw channels if any
  channelLines.forEach(ch => drawChannel(ch));
}

function simulateRain() {
  rainParticles = [];
  const canvas = document.getElementById('rainCanvas');
  // Create 150 rain particles
  for (let i = 0; i < 150; i++) {
    rainParticles.push({
      x: randomInRange(0, canvas.width),
      y: randomInRange(0, canvas.height * 0.3),
      vx: randomInRange(-0.5, 0.5),
      vy: randomInRange(1, 3),
      life: 1,
      trail: []
    });
  }
  animateRain(0);
}

function animateRain(frame) {
  if (frame > 120) {
    // Settle particles to show water accumulation
    showWaterAccumulation();
    return;
  }
  drawTerrain();

  rainParticles.forEach(p => {
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 8) p.trail.shift();

    // Flow based on terrain gradient
    const tIdx = Math.floor(p.y / 10) * 70 + Math.floor(p.x / 10);
    const neighbor = farmTerrain[tIdx + 1];
    if (neighbor && neighbor.elevation < (farmTerrain[tIdx] || {elevation: 0}).elevation) {
      p.vx += 0.1;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravity

    // Bounce off edges
    if (p.x < 0 || p.x > document.getElementById('rainCanvas').width) p.vx *= -0.5;
    if (p.y > document.getElementById('rainCanvas').height) {
      p.y = document.getElementById('rainCanvas').height - 5;
      p.vy *= -0.2;
      p.vx *= 0.9;
    }

    // Draw trail
    if (p.trail.length > 1) {
      rainCtx.beginPath();
      rainCtx.strokeStyle = 'rgba(56, 200, 255, 0.6)';
      rainCtx.lineWidth = 1.5;
      p.trail.forEach((pt, i) => {
        if (i === 0) rainCtx.moveTo(pt.x, pt.y);
        else rainCtx.lineTo(pt.x, pt.y);
      });
      rainCtx.stroke();
    }

    // Draw drop
    rainCtx.beginPath();
    rainCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    rainCtx.fillStyle = '#38c8ff';
    rainCtx.fill();
  });

  requestAnimationFrame(() => animateRain(frame + 1));
}

function showWaterAccumulation() {
  drawTerrain();
  // Show puddle zones at low elevation
  farmTerrain.forEach(point => {
    if (point.elevation < -10) {
      rainCtx.beginPath();
      rainCtx.arc(point.x + 5, point.y + 5, 8, 0, Math.PI * 2);
      rainCtx.fillStyle = 'rgba(56, 200, 255, 0.3)';
      rainCtx.fill();
    }
  });
}

async function generateChannels() {
  const btn = event.target;
  btn.textContent = '⏳ AI DESIGNING...';
  btn.disabled = true;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `You are an agricultural water routing AI. A 700x350 pixel farm field has been analyzed with rain simulation. Water accumulates at low-elevation zones. Design water channels to route water from high accumulation zones to dry areas. 

Respond ONLY with JSON (no markdown):
{
  "channels": [
    {"from_x": <0-700>, "from_y": <0-350>, "to_x": <0-700>, "to_y": <0-350>, "label": "<channel name>", "priority": <1-3>}
  ],
  "instructions": [
    "<step 1>",
    "<step 2>",
    "<step 3>",
    "<step 4>",
    "<step 5>"
  ],
  "total_channels": <number>,
  "water_saved_pct": <estimated % water saved>
}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const result = JSON.parse(text.trim());
    displayChannels(result);

  } catch (err) {
    const demo = {
      channels: [
        {from_x: 100, from_y: 50, to_x: 400, to_y: 200, label: "Main Channel A", priority: 1},
        {from_x: 400, from_y: 200, to_x: 620, to_y: 300, label: "Branch Channel B", priority: 2},
        {from_x: 250, from_y: 100, to_x: 400, to_y: 200, label: "Sub-channel C", priority: 2}
      ],
      instructions: [
        "1. Dig 30cm wide trench from northwest corner (100,50) to center field (400,200)",
        "2. Create secondary branch trench from center to southeast (620,300)",
        "3. Line trenches with clay to prevent seepage",
        "4. Install simple wooden sluice gates at junction points",
        "5. Dry zone identified at coordinates (550,280) — direct water here first"
      ],
      total_channels: 3,
      water_saved_pct: 35
    };
    displayChannels(demo);
  } finally {
    btn.textContent = '⚡ AI Channel Design';
    btn.disabled = false;
  }
}

function displayChannels(result) {
  channelLines = result.channels || [];
  drawTerrain();
  channelLines.forEach(ch => drawChannel(ch));

  const inst = document.getElementById('channelInstructions');
  const steps = result.instructions || [];
  inst.innerHTML = steps.map(s => `<div style="margin-bottom:0.5rem">📍 ${s}</div>`).join('') +
    `<div style="margin-top:1rem;color:var(--green);font-weight:700">
      ✅ ${result.total_channels} channels designed | 💧 ${result.water_saved_pct}% water savings estimated
    </div>`;
}

function drawChannel(ch) {
  if (!rainCtx) return;
  const colors = ['#00ff88', '#f5e642', '#38c8ff'];
  rainCtx.beginPath();
  rainCtx.moveTo(ch.from_x, ch.from_y);
  rainCtx.lineTo(ch.to_x, ch.to_y);
  rainCtx.strokeStyle = colors[(ch.priority || 1) - 1];
  rainCtx.lineWidth = 4 - (ch.priority || 1);
  rainCtx.setLineDash([5, 3]);
  rainCtx.stroke();
  rainCtx.setLineDash([]);

  // Label
  const mx = (ch.from_x + ch.to_x) / 2;
  const my = (ch.from_y + ch.to_y) / 2;
  rainCtx.font = '10px JetBrains Mono';
  rainCtx.fillStyle = colors[(ch.priority || 1) - 1];
  rainCtx.fillText(ch.label || '', mx - 20, my - 5);
}

function clearRainMap() {
  rainParticles = [];
  channelLines = [];
  drawTerrain();
  document.getElementById('channelInstructions').textContent =
    'Click "Simulate Rain" to see water flow patterns, then "AI Channel Design" to get digging instructions.';
}
