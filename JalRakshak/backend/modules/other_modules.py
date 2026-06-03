"""MODULE 5: Root Moisture Scanner (Ultrasonic Simulation)"""
import random, math
from flask import Blueprint, request, jsonify

root_scanner_bp = Blueprint('root_scanner', __name__)

@root_scanner_bp.route('/scan', methods=['POST'])
def scan_root_moisture():
    data = request.get_json()
    probe_freq_khz = float(data.get('frequency_khz', 40))
    soil_type = data.get('soil_type', 'loam')

    # Soil type affects moisture distribution
    depth_factors = {'sand': [1.2, 0.9, 0.7, 0.6], 'clay': [0.8, 1.1, 1.3, 1.1], 'loam': [1.0, 1.0, 1.0, 0.9]}
    factors = depth_factors.get(soil_type, [1.0, 1.0, 1.0, 0.9])
    base_moisture = random.uniform(25, 65)

    depths = {
        '0_5cm': round(min(95, base_moisture * factors[0] + random.gauss(0, 3))),
        '5_15cm': round(min(95, base_moisture * factors[1] + random.gauss(0, 3))),
        '15_40cm': round(min(95, base_moisture * factors[2] + random.gauss(0, 3))),
        '40plus_cm': round(min(95, base_moisture * factors[3] + random.gauss(0, 3)))
    }

    root_moisture = depths['15_40cm']
    status = 'critical' if root_moisture < 25 else 'low' if root_moisture < 40 else 'adequate' if root_moisture < 65 else 'high'
    needs_irrigation = root_moisture < 40

    return jsonify({
        'success': True, 'soil_type': soil_type,
        'probe_frequency_khz': probe_freq_khz,
        'depth_readings': depths,
        'root_zone_moisture': root_moisture,
        'status': status,
        'needs_irrigation': needs_irrigation,
        'water_amount_mm': max(0, round((50 - root_moisture) * 0.6)) if needs_irrigation else 0,
        'recommendation': f"Root zone: {root_moisture}% ({'IRRIGATE NOW' if status == 'critical' else 'Schedule soon' if status == 'low' else 'OK'})"
    })


"""MODULE 6: Farm Digital Twin"""
digital_twin_bp = Blueprint('digital_twin', __name__)

@digital_twin_bp.route('/simulate', methods=['POST'])
def simulate_farm():
    data = request.get_json()
    hour = int(data.get('hour', 12))
    zones = int(data.get('zones', 5))

    evap_rate = 0.3 + (2.5 if 9 <= hour <= 17 else 0.2) + (hour == 12) * 0.5
    zone_data = []
    for i in range(zones):
        base_moisture = random.uniform(35, 75)
        moisture = max(10, base_moisture - evap_rate * hour * 0.5)
        zone_data.append({
            'zone_id': i + 1,
            'moisture_pct': round(moisture),
            'evap_rate_mm_hr': round(evap_rate, 2),
            'needs_irrigation': moisture < 35,
            'irrigation_in_hours': max(0, round((moisture - 30) / max(0.1, evap_rate)))
        })

    total_water = sum(max(0, 50 - z['moisture_pct']) * 0.3 for z in zone_data)
    return jsonify({'success': True, 'hour': hour, 'zones': zone_data,
                    'total_water_needed_mm': round(total_water),
                    'evaporation_rate_mm_hr': round(evap_rate, 2)})


"""MODULE 7: Tractor IQ — GPS Movement Based Mapping"""
tractor_bp = Blueprint('tractor', __name__)

@tractor_bp.route('/analyze', methods=['POST'])
def analyze_tractor_path():
    data = request.get_json()
    gps_points = data.get('gps_points', [])
    accelerometer = data.get('accelerometer', [])

    if not gps_points:
        return jsonify({'error': 'No GPS data provided'}), 400

    dry_zones, wet_zones = [], []
    for i, point in enumerate(gps_points):
        acc_val = accelerometer[i] if i < len(accelerometer) else random.uniform(0.1, 0.9)
        dryness = min(100, acc_val * 80 + random.uniform(-10, 10))
        entry = {'lat': point.get('lat', 18.52), 'lng': point.get('lng', 73.85),
                 'dryness_pct': round(dryness), 'bump_intensity': round(acc_val, 3)}
        (dry_zones if dryness > 60 else wet_zones).append(entry)

    return jsonify({
        'success': True, 'total_points': len(gps_points),
        'dry_zones': dry_zones[:5], 'wet_zones': wet_zones[:5],
        'avg_dryness': round(sum(d['dryness_pct'] for d in dry_zones) / max(1, len(dry_zones))),
        'irrigation_zones': [{'priority': i+1, 'lat': z['lat'], 'lng': z['lng'],
                               'water_needed_mm': round((z['dryness_pct'] / 100) * 40)}
                              for i, z in enumerate(dry_zones[:3])]
    })


"""MODULE 8: Plant Transpiration Detector"""
transpiration_bp = Blueprint('transpiration', __name__)

@transpiration_bp.route('/measure', methods=['POST'])
def measure_transpiration():
    data = request.get_json()
    leaf_temp_c = float(data.get('leaf_temp_c', 32))
    air_temp_c = float(data.get('air_temp_c', 30))
    humidity_pct = float(data.get('humidity_pct', 55))
    solar_rad = float(data.get('solar_radiation_w_m2', 400))

    # VPD calculation (kPa)
    import math
    e_sat_leaf = 0.6108 * math.exp(17.27 * leaf_temp_c / (leaf_temp_c + 237.3))
    e_sat_air = 0.6108 * math.exp(17.27 * air_temp_c / (air_temp_c + 237.3))
    e_actual = e_sat_air * (humidity_pct / 100)
    vpd = round(e_sat_leaf - e_actual, 3)

    # Transpiration rate (Penman-Monteith simplified)
    temp_diff = max(0, leaf_temp_c - air_temp_c)
    trans_rate = min(10.0, (vpd * 2.5) + (solar_rad / 500) * 3.0 + temp_diff * 0.2)
    trans_rate = round(trans_rate, 2)

    stomatal = ('Fully Open' if trans_rate > 7 else 'Partially Open' if trans_rate > 3.5 else 'Closing')
    water_loss = round(trans_rate * 0.04, 3)
    needs_water = vpd > 1.5 or trans_rate > 6

    return jsonify({
        'success': True, 'vpd_kpa': vpd,
        'transpiration_rate_mm_hr': trans_rate,
        'water_loss_mm_hr': water_loss,
        'stomatal_conductance': stomatal,
        'leaf_temp_c': leaf_temp_c, 'air_temp_c': air_temp_c,
        'needs_irrigation': needs_water,
        'irrigation_amount_mm': round(trans_rate * 4) if needs_water else 0,
        'stress_level': 'high' if vpd > 2.0 else 'moderate' if vpd > 1.0 else 'low',
        'recommendation': f"VPD={vpd}kPa, transpiration={trans_rate}mm/hr. "
                         f"{'Irrigate now — high water loss detected.' if needs_water else 'Plant well-hydrated.'}"
    })
