// ===== MODULE 1: PLANT VISION AI =====

document.getElementById('plantImageInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const preview = document.getElementById('plantPreview');
    const placeholder = document.querySelector('.feed-placeholder');
    preview.src = ev.target.result;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

async function analyzePlant() {
  const btn = document.getElementById('analyzeBtn');
  const preview = document.getElementById('plantPreview');

  // Check if image uploaded
  if (preview.classList.contains('hidden')) {
    // Simulate with demo data if no image
    runDemoAnalysis();
    return;
  }

  btn.textContent = '⏳ ANALYZING...';
  btn.disabled = true;

  try {
    // Get image as base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = preview.naturalWidth;
    canvas.height = preview.naturalHeight;
    ctx.drawImage(preview, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageData }
            },
            {
              type: 'text',
              text: `You are a plant water stress detection AI. Analyze this plant image and respond ONLY with a JSON object (no markdown, no backticks):
{
  "hydration": <0-100 number, leaf hydration %>,
  "wilting_index": <0-100 number, higher = more wilted>,
  "chlorophyll": <0-100 number, chlorophyll level %>,
  "stress_score": <0-100 number, water stress level>,
  "needs_water": <true/false>,
  "urgency": <"immediate"|"soon"|"ok">,
  "recommendation": "<1 sentence irrigation recommendation>",
  "observations": "<2-3 visible signs you detected>"
}`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const result = JSON.parse(text.trim());
    displayPlantResults(result);

  } catch (err) {
    console.error('Plant analysis error:', err);
    runDemoAnalysis();
  } finally {
    btn.textContent = '⚡ ANALYZE PLANT STRESS';
    btn.disabled = false;
  }
}

function runDemoAnalysis() {
  const demo = {
    hydration: Math.round(randomInRange(30, 75)),
    wilting_index: Math.round(randomInRange(20, 65)),
    chlorophyll: Math.round(randomInRange(40, 85)),
    stress_score: Math.round(randomInRange(35, 70)),
    needs_water: true,
    urgency: 'soon',
    recommendation: 'Moderate water stress detected. Irrigate within 4 hours with 20L/m².',
    observations: 'Slight leaf curl detected. Color shows early chlorosis. Edges show mild dryness.'
  };
  displayPlantResults(demo);
}

function displayPlantResults(result) {
  // Animate bars
  setTimeout(() => {
    setBarWidth('hydrationBar', result.hydration);
    setBarWidth('wiltBar', result.wilting_index);
    setBarWidth('chloroBar', result.chlorophyll);
    setBarWidth('stressBar', result.stress_score);
  }, 100);

  document.getElementById('hydrationVal').textContent = result.hydration + '%';
  document.getElementById('wiltVal').textContent = result.wilting_index + '% wilted';
  document.getElementById('chloroVal').textContent = result.chlorophyll + '%';
  document.getElementById('stressVal').textContent = result.stress_score + ' / 100';

  const verdict = document.getElementById('irrigationVerdict');
  const verdictText = document.getElementById('verdictText');

  const urgencyEmoji = {
    'immediate': '🚨',
    'soon': '⚠️',
    'ok': '✅'
  };

  verdict.style.background = result.needs_water
    ? 'rgba(255, 61, 90, 0.1)'
    : 'rgba(0, 255, 136, 0.08)';
  verdict.style.borderColor = result.needs_water ? '#ff3d5a' : '#00ff88';

  verdictText.textContent = `${urgencyEmoji[result.urgency] || '💧'} ${result.recommendation}`;

  if (result.observations) {
    const obsEl = document.createElement('div');
    obsEl.style.cssText = 'margin-top:0.5rem;font-size:0.75rem;color:#7ab89a;font-family:var(--font-mono)';
    obsEl.textContent = '🔍 ' + result.observations;
    verdict.appendChild(obsEl);
  }
}
