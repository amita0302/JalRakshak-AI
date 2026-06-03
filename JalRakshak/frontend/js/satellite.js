// ===== MODULE 2: SATELLITE RADAR IRRIGATION =====

function initSatGrid() {
  const grid = document.getElementById('satGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < 200; i++) {
    const cell = document.createElement('div');
    cell.className = 'sat-cell';
    cell.style.background = `hsl(${Math.random() * 60 + 20}, 50%, 15%)`;
    grid.appendChild(cell);
  }
}

async function fetchSatelliteData() {
  const lat = parseFloat(document.getElementById('satLat').value) || 18.52;
  const lng = parseFloat(document.getElementById('satLng').value) || 73.85;
  const area = parseFloat(document.getElementById('farmArea').value) || 5;

  const btn = event.target;
  btn.textContent = '⏳ FETCHING...';
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
          content: `You are a satellite data analysis AI for precision agriculture. Given farm coordinates Latitude: ${lat}, Longitude: ${lng}, Area: ${area} hectares in India, simulate realistic satellite indices. Respond ONLY with JSON (no markdown, no backticks):
{
  "ndvi": <-1 to 1 float, vegetation index>,
  "ndwi": <-1 to 1 float, water index>,
  "evi": <0 to 1 float, enhanced vegetation>,
  "soil_temp_c": <number, surface temp in Celsius>,
  "moisture_pct": <0-100, estimated soil moisture %>,
  "crop_health": <"poor"|"moderate"|"good"|"excellent">,
  "irrigation_needed": <true/false>,
  "water_amount_mm": <number, mm of water recommended>,
  "recommendation": "<2 sentence irrigation advice based on satellite data>",
  "zone_map": <array of 20 numbers 0-100 representing moisture across farm zones>
}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const result = JSON.parse(text.trim());
    displaySatResults(result);

  } catch (err) {
    // Fallback demo data
    const demo = {
      ndvi: (Math.random() * 0.6 + 0.2).toFixed(3),
      ndwi: (Math.random() * 0.4 - 0.3).toFixed(3),
      evi: (Math.random() * 0.5 + 0.1).toFixed(3),
      soil_temp_c: Math.round(randomInRange(28, 40)),
      moisture_pct: Math.round(randomInRange(20, 55)),
      crop_health: 'moderate',
      irrigation_needed: true,
      water_amount_mm: Math.round(randomInRange(15, 40)),
      recommendation: 'Satellite data shows moderate vegetation stress. NDWI indicates low canopy water content. Recommend irrigation of 25mm within 24 hours.',
      zone_map: Array.from({length: 20}, () => Math.round(randomInRange(10, 80)))
    };
    displaySatResults(demo);
  } finally {
    btn.textContent = '🛰 FETCH SATELLITE DATA';
    btn.disabled = false;
  }
}

function displaySatResults(result) {
  // Update indices
  document.getElementById('ndviVal').textContent = parseFloat(result.ndvi).toFixed(3);
  document.getElementById('ndwiVal').textContent = parseFloat(result.ndwi).toFixed(3);
  document.getElementById('eviVal').textContent = parseFloat(result.evi).toFixed(3);
  document.getElementById('tempVal').textContent = result.soil_temp_c + '°C';

  // Color-code NDVI
  const ndvi = parseFloat(result.ndvi);
  document.getElementById('ndviVal').style.color = ndvi > 0.5 ? '#00ff88' : ndvi > 0.3 ? '#f5e642' : '#ff3d5a';
  document.getElementById('ndwiVal').style.color = parseFloat(result.ndwi) > 0 ? '#38c8ff' : '#ff7c38';

  // Update satellite grid
  const cells = document.querySelectorAll('.sat-cell');
  const zones = result.zone_map || [];
  cells.forEach((cell, i) => {
    const moisture = zones[i % zones.length] || Math.random() * 100;
    const hue = moisture > 60 ? 140 : moisture > 35 ? 60 : 0;
    const sat = 70;
    const light = 15 + moisture * 0.2;
    cell.style.background = `hsl(${hue}, ${sat}%, ${light}%)`;
  });

  // Recommendation
  const rec = document.getElementById('satRec');
  rec.style.background = result.irrigation_needed
    ? 'rgba(255,61,90,0.08)' : 'rgba(0,255,136,0.08)';
  rec.style.borderColor = result.irrigation_needed ? '#ff3d5a' : '#00ff88';
  rec.innerHTML = `
    <strong>${result.irrigation_needed ? '⚠️ IRRIGATION NEEDED' : '✅ SOIL MOISTURE OK'}</strong><br>
    <span style="font-size:0.85rem;opacity:0.8">${result.recommendation}</span>
    ${result.irrigation_needed ? `<br><br><strong style="color:#38c8ff">Recommended: ${result.water_amount_mm}mm water</strong>` : ''}
  `;
}
