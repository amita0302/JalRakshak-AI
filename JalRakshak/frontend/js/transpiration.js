// ===== MODULE 8: PLANT TRANSPIRATION DETECTOR =====

let gaugeCtx;

function initGauge() {
  const canvas = document.getElementById('gaugeCanvas');
  if (!canvas) return;
  gaugeCtx = canvas.getContext('2d');
  drawGauge(0);
  updateTranspiration();
}

function drawGauge(value) {
  if (!gaugeCtx) return;
  const canvas = document.getElementById('gaugeCanvas');
  const w = canvas.width, h = canvas.height;
  gaugeCtx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h * 0.75, r = Math.min(w, h) * 0.55;
  const startAngle = Math.PI, endAngle = 2 * Math.PI;

  // Background arc
  gaugeCtx.beginPath();
  gaugeCtx.arc(cx, cy, r, startAngle, endAngle);
  gaugeCtx.strokeStyle = 'rgba(255,255,255,0.1)';
  gaugeCtx.lineWidth = 16;
  gaugeCtx.stroke();

  // Value arc
  const valAngle = startAngle + (value / 100) * Math.PI;
  const hue = value < 30 ? 140 : value < 60 ? 60 : value < 80 ? 30 : 0;
  gaugeCtx.beginPath();
  gaugeCtx.arc(cx, cy, r, startAngle, valAngle);
  gaugeCtx.strokeStyle = `hsl(${hue}, 90%, 55%)`;
  gaugeCtx.lineWidth = 16;
  gaugeCtx.lineCap = 'round';
  gaugeCtx.stroke();

  // Value text
  gaugeCtx.font = 'bold 32px JetBrains Mono';
  gaugeCtx.fillStyle = `hsl(${hue}, 90%, 55%)`;
  gaugeCtx.textAlign = 'center';
  gaugeCtx.fillText(value + '%', cx, cy - 5);

  gaugeCtx.font = '11px JetBrains Mono';
  gaugeCtx.fillStyle = 'rgba(255,255,255,0.5)';
  gaugeCtx.fillText('TRANSPIRATION RATE', cx, cy + 20);

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const angle = startAngle + (i / 10) * Math.PI;
    const x1 = cx + (r - 22) * Math.cos(angle);
    const y1 = cy + (r - 22) * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    gaugeCtx.beginPath();
    gaugeCtx.moveTo(x1, y1);
    gaugeCtx.lineTo(x2, y2);
    gaugeCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    gaugeCtx.lineWidth = 1;
    gaugeCtx.stroke();
  }
}

function updateTranspiration() {
  const leafTemp = parseInt(document.getElementById('leafTemp')?.value || 32);
  const humidity = parseInt(document.getElementById('ambHumidity')?.value || 55);
  const airTemp = parseInt(document.getElementById('airTemp')?.value || 30);

  const leafTempValEl = document.getElementById('leafTempVal');
  const ambHumidityValEl = document.getElementById('ambHumidityVal');
  const airTempValEl = document.getElementById('airTempVal');
  if (leafTempValEl) leafTempValEl.textContent = leafTemp + '°C';
  if (ambHumidityValEl) ambHumidityValEl.textContent = humidity + '%';
  if (airTempValEl) airTempValEl.textContent = airTemp + '°C';

  // VPD calculation (Penman-Monteith)
  const esat = 0.6108 * Math.exp(17.27 * airTemp / (airTemp + 237.3));
  const ea = esat * (humidity / 100);
  const vpd = (esat - ea).toFixed(2);

  const tempDiff = Math.max(0, leafTemp - airTemp);
  const transRate = Math.round(Math.min(100, (vpd * 25) + (tempDiff * 3) + randomInRange(-2, 2)));
  const waterLoss = (transRate * 0.04).toFixed(2);
  const stomatal = transRate > 70 ? 'Fully Open (stressed)' :
                   transRate > 40 ? 'Partially Open' : 'Closing (conserving)';

  drawGauge(transRate);

  const transRateEl = document.getElementById('transRate');
  const vpdValEl = document.getElementById('vpdVal');
  const waterLossEl = document.getElementById('waterLoss');
  const stomatStatusEl = document.getElementById('stomatStatus');
  if (transRateEl) transRateEl.textContent = transRate + '% active';
  if (vpdValEl) vpdValEl.textContent = vpd + ' kPa';
  if (waterLossEl) waterLossEl.textContent = waterLoss + ' mm/hr';
  if (stomatStatusEl) stomatStatusEl.textContent = stomatal;

  const verdict = document.getElementById('transVerdict');
  if (!verdict) return;
  if (transRate > 70) {
    verdict.textContent = '🚨 High transpiration! Plant is losing significant water. Irrigate immediately with 25mm.';
    verdict.style.borderColor = '#ff3d5a';
    verdict.style.background = 'rgba(255,61,90,0.08)';
  } else if (transRate > 40) {
    verdict.textContent = '⚠️ Moderate transpiration. Plant is managing water stress. Schedule irrigation in 4–6 hours.';
    verdict.style.borderColor = '#f5e642';
    verdict.style.background = 'rgba(245,230,66,0.08)';
  } else {
    verdict.textContent = '✅ Low transpiration. Plant is well-hydrated. No irrigation needed for 24+ hours.';
    verdict.style.borderColor = '#ff38a4';
    verdict.style.background = 'rgba(255,56,164,0.08)';
  }
}
