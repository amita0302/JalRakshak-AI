// ===== MODULE 4: VOICE IRRIGATION CONTROL =====

let recognition = null;
let isListening = false;

const VOICE_COMMANDS = {
  // Hindi
  'पानी चालू करो': { action: 'start', response: '✅ पानी चालू हो गया। Motor zone 1,2,3 start.' },
  'मोटर बंद करो': { action: 'stop', response: '🔴 मोटर बंद हो गई। All zones stopped.' },
  'कितनी नमी है': { action: 'moisture', response: '💧 Soil moisture: Zone 1: 42%, Zone 2: 38%, Zone 3: 61%' },
  // Marathi
  'पाणी सुरू करा': { action: 'start', response: '✅ पाणी सुरू झाले। Motor ON.' },
  'मोटर बंद करा': { action: 'stop', response: '🔴 मोटर बंद झाली।' },
  // Hinglish
  'pani chalu karo': { action: 'start', response: '✅ Pani chalu ho gaya! Motor started.' },
  'motor band karo': { action: 'stop', response: '🔴 Motor band. All irrigation stopped.' },
  // English
  'start irrigation': { action: 'start', response: '✅ Irrigation started. All zones active. Est. 45 minutes.' },
  'stop motor': { action: 'stop', response: '🔴 Motor stopped. Water valve closed.' },
  'stop irrigation': { action: 'stop', response: '🔴 Irrigation stopped.' },
  'water status': { action: 'status', response: '📊 Tank: 78% full | Motor: ON | Zone 1,2 active | Next: 6 AM' },
  'kitni nami hai': { action: 'moisture', response: '💧 Current moisture: Zone A: 45%, Zone B: 33% (needs water!), Zone C: 68%' },
};

function toggleVoice() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  const orb = document.getElementById('voiceOrb');
  const status = document.getElementById('voiceStatus');

  // Try Web Speech API
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

    recognition.onstart = () => {
      isListening = true;
      orb.classList.add('active');
      status.textContent = '🎤 LISTENING...';
    };

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript).join('');
      document.getElementById('voiceTranscript').textContent = transcript;
      if (e.results[0].isFinal) processCommand(transcript.toLowerCase().trim());
    };

    recognition.onerror = () => {
      stopListening();
      status.textContent = 'Tap mic to activate (demo mode available)';
    };

    recognition.onend = () => stopListening();
    recognition.start();
  } else {
    // Demo mode
    isListening = true;
    orb.classList.add('active');
    status.textContent = '🎤 DEMO MODE (click a command below)';
  }
}

function stopListening() {
  isListening = false;
  const orb = document.getElementById('voiceOrb');
  const status = document.getElementById('voiceStatus');
  orb.classList.remove('active');
  status.textContent = 'Tap mic to activate';
  if (recognition) { recognition.stop(); recognition = null; }
}

function simulateCommand(cmd) {
  document.getElementById('voiceTranscript').textContent = '🎤 "' + cmd + '"';
  processCommand(cmd.toLowerCase());
}

async function processCommand(cmd) {
  const responseEl = document.getElementById('voiceResponse');
  responseEl.textContent = '⏳ Processing...';

  // Check local offline commands first
  for (const [key, val] of Object.entries(VOICE_COMMANDS)) {
    if (cmd.includes(key.toLowerCase()) || key.toLowerCase().includes(cmd)) {
      responseEl.textContent = val.response;
      executeFarmAction(val.action);
      return;
    }
  }

  // If not found locally, use AI
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are an offline voice assistant for Indian farmers controlling irrigation. The farmer said: "${cmd}". 
          
Respond in the same language they used (Hindi/Marathi/English/Hinglish). Give a SHORT practical response about their farm irrigation system. Respond ONLY with JSON:
{"response": "<farmer-friendly response in their language>", "action": "<start|stop|status|moisture|unknown>"}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const result = JSON.parse(text.trim());
    responseEl.textContent = result.response;
    executeFarmAction(result.action);

  } catch (err) {
    responseEl.textContent = '❓ Command not recognized. Try: "Start irrigation" or "पानी चालू करो"';
  }
}

function executeFarmAction(action) {
  // Visual feedback for actions
  const orb = document.getElementById('voiceOrb');
  const colors = {
    'start': '#00ff88',
    'stop': '#ff3d5a',
    'moisture': '#38c8ff',
    'status': '#f5e642'
  };

  if (colors[action]) {
    orb.style.filter = `drop-shadow(0 0 20px ${colors[action]})`;
    setTimeout(() => orb.style.filter = '', 2000);
  }
}
