"""
MODULE 2: Satellite Radar Irrigation
Fetches NDVI, NDWI from Sentinel/Landsat APIs (or simulates for demo)
"""

import math
import random
from flask import Blueprint, request, jsonify

satellite_bp = Blueprint('satellite', __name__)


def calculate_vegetation_indices(lat, lng):
    """
    Calculate simulated NDVI/NDWI based on location and season.
    In production: replace with Sentinel Hub, NASA EarthData, or ISRO Bhuvan API.
    """
    # Seasonal modifier (simplified)
    import datetime
    month = datetime.datetime.now().month
    season_factor = math.sin((month - 3) * math.pi / 6) * 0.2  # India seasons

    # Base values modulated by lat/lng (simplified spatial variation)
    ndvi = max(-0.1, min(0.9, 0.45 + season_factor + math.sin(lat * 10) * 0.1 + random.uniform(-0.05, 0.05)))
    ndwi = max(-0.5, min(0.5, -0.1 + season_factor * 0.5 + random.uniform(-0.1, 0.1)))
    evi  = max(0, min(1.0, ndvi * 0.85 + random.uniform(-0.02, 0.02)))

    return {
        'ndvi': round(ndvi, 4),
        'ndwi': round(ndwi, 4),
        'evi': round(evi, 4),
    }


def estimate_soil_moisture(ndwi, ndvi, area_ha):
    """Estimate soil moisture % from satellite indices"""
    # NDWI correlates inversely with dryness
    # Higher NDWI = more water content
    moisture = max(10, min(95, (ndwi + 0.5) * 80 + ndvi * 10 + random.uniform(-5, 5)))
    return round(moisture)


@satellite_bp.route('/fetch', methods=['POST'])
def fetch_satellite():
    data = request.get_json()
    lat = float(data.get('lat', 18.52))
    lng = float(data.get('lng', 73.85))
    area = float(data.get('area_ha', 5))

    indices = calculate_vegetation_indices(lat, lng)
    moisture = estimate_soil_moisture(indices['ndwi'], indices['ndvi'], area)

    soil_temp = round(28 + (1 - indices['ndwi']) * 15 + random.uniform(-2, 2), 1)
    water_needed = max(0, round((50 - moisture) * 0.5))
    needs_irrigation = moisture < 45

    # 20x10 zone moisture map
    zone_map = []
    for _ in range(200):
        zone_moisture = max(5, min(95, moisture + random.gauss(0, 15)))
        zone_map.append(round(zone_moisture))

    return jsonify({
        'success': True,
        'coordinates': {'lat': lat, 'lng': lng},
        'area_ha': area,
        'indices': indices,
        'soil_moisture_pct': moisture,
        'soil_temp_c': soil_temp,
        'needs_irrigation': needs_irrigation,
        'water_needed_mm': water_needed,
        'zone_map': zone_map,
        'data_source': 'Sentinel-2 (simulated)',
        'recommendation': f"NDVI={indices['ndvi']:.3f} indicates {'healthy' if indices['ndvi'] > 0.4 else 'stressed'} vegetation. "
                         f"{'Irrigate with ' + str(water_needed) + 'mm within 24hrs.' if needs_irrigation else 'Moisture adequate.'}"
    })
