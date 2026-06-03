"""
AGROMIND - Smart Irrigation Intelligence Platform
Main Flask Application
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

# Import all module routes
from modules.plant_vision import plant_vision_bp
from modules.satellite import satellite_bp
from modules.rainwater import rainwater_bp
from modules.voice_control import voice_bp
from modules.root_scanner import root_scanner_bp
from modules.digital_twin import digital_twin_bp
from modules.tractor_iq import tractor_bp
from modules.transpiration import transpiration_bp

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Register all module blueprints
app.register_blueprint(plant_vision_bp, url_prefix='/api/plant')
app.register_blueprint(satellite_bp, url_prefix='/api/satellite')
app.register_blueprint(rainwater_bp, url_prefix='/api/rain')
app.register_blueprint(voice_bp, url_prefix='/api/voice')
app.register_blueprint(root_scanner_bp, url_prefix='/api/root')
app.register_blueprint(digital_twin_bp, url_prefix='/api/twin')
app.register_blueprint(tractor_bp, url_prefix='/api/tractor')
app.register_blueprint(transpiration_bp, url_prefix='/api/transpiration')


@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')


@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'modules': [
            'plant_vision', 'satellite', 'rainwater', 'voice',
            'root_scanner', 'digital_twin', 'tractor_iq', 'transpiration'
        ],
        'version': '1.0.0'
    })


@app.route('/api/dashboard')
def dashboard_summary():
    """Returns a combined summary for the dashboard"""
    return jsonify({
        'farm_status': 'monitoring',
        'active_zones': 3,
        'last_irrigation': '2024-01-15T06:30:00',
        'next_scheduled': '2024-01-16T06:00:00',
        'water_saved_today_liters': 2450,
        'alerts': [
            {'zone': 'B', 'type': 'moisture_low', 'value': 28},
        ]
    })


if __name__ == '__main__':
    print("🌿 AGROMIND Smart Irrigation Platform")
    print("=" * 40)
    print("Starting server on http://localhost:5000")
    print("Modules: Plant Vision | Satellite | Rain Map | Voice AI")
    print("         Root Scan | Digital Twin | Tractor IQ | Transpiration")
    app.run(debug=True, host='0.0.0.0', port=5000)
