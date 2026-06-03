"""
MODULE 4: Voice Irrigation Control (Offline-capable)
Multi-language command processing for Hindi, Marathi, English, Hinglish
"""
import re
from flask import Blueprint, request, jsonify

voice_bp = Blueprint('voice', __name__)

COMMAND_MAP = {
    # Hindi
    r'पानी\s*(चालू|शुरू|ऑन)': {'action': 'start', 'response': '✅ पानी चालू हो गया।', 'zone': 'all'},
    r'मोटर\s*(बंद|ऑफ|रोको)': {'action': 'stop', 'response': '🔴 मोटर बंद हो गई।', 'zone': 'all'},
    r'(कितनी|कितना)\s*नमी': {'action': 'moisture', 'response': '💧 Zone 1: 42% | Zone 2: 38% | Zone 3: 61%'},
    # Marathi
    r'पाणी\s*(सुरू|चालू)': {'action': 'start', 'response': '✅ पाणी सुरू झाले।', 'zone': 'all'},
    r'मोटर\s*बंद': {'action': 'stop', 'response': '🔴 मोटर बंद झाली।', 'zone': 'all'},
    # English
    r'start\s*(irrigation|water|motor)': {'action': 'start', 'response': '✅ Irrigation started. Est. 45 min.', 'zone': 'all'},
    r'stop\s*(irrigation|water|motor)': {'action': 'stop', 'response': '🔴 Irrigation stopped. Valve closed.', 'zone': 'all'},
    r'(moisture|humidity|soil)\s*(status|level|check)': {'action': 'moisture', 'response': '💧 Zone A: 45% | Zone B: 33% | Zone C: 68%'},
    r'(water|irrigation)\s*status': {'action': 'status', 'response': '📊 Tank: 78% | Motor: ON | Zone 1,2 active'},
    # Hinglish
    r'pani\s*(chalu|shuru|on)': {'action': 'start', 'response': '✅ Pani chalu! Motor started.', 'zone': 'all'},
    r'motor\s*(band|off|stop)': {'action': 'stop', 'response': '🔴 Motor band. Irrigation stopped.', 'zone': 'all'},
    r'kitni\s*nami': {'action': 'moisture', 'response': '💧 Nami: Zone A 45%, Zone B 33% (kam hai!), Zone C 68%'},
}

@voice_bp.route('/command', methods=['POST'])
def process_voice():
    data = request.get_json()
    text = data.get('text', '').strip().lower()

    for pattern, result in COMMAND_MAP.items():
        if re.search(pattern, text, re.IGNORECASE | re.UNICODE):
            return jsonify({
                'success': True,
                'action': result['action'],
                'response': result['response'],
                'zone': result.get('zone', 'all'),
                'matched_pattern': pattern,
                'offline': True
            })

    return jsonify({
        'success': False,
        'action': 'unknown',
        'response': f'Command not recognized: "{text}". Try: "Start irrigation" or "पानी चालू करो"',
        'offline': True
    })

@voice_bp.route('/commands', methods=['GET'])
def list_commands():
    return jsonify({
        'hindi': ['पानी चालू करो', 'मोटर बंद करो', 'कितनी नमी है'],
        'marathi': ['पाणी सुरू करा', 'मोटर बंद करा'],
        'english': ['Start irrigation', 'Stop motor', 'Moisture status'],
        'hinglish': ['Pani chalu karo', 'Motor band karo', 'Kitni nami hai']
    })
