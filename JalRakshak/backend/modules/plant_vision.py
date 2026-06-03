"""
MODULE 1: Plant Emotion AI — Water Stress Detection from Camera
Uses OpenCV for image analysis + optionally TensorFlow for deep learning inference
"""

import numpy as np
from flask import Blueprint, request, jsonify
import base64
import io
import math

plant_vision_bp = Blueprint('plant_vision', __name__)

# ─── COLOR RANGE CONSTANTS (HSV) ──────────────────────────────────────────────
# Healthy green range
HEALTHY_GREEN_LOWER = (35, 40, 40)
HEALTHY_GREEN_UPPER = (85, 255, 255)

# Yellow/stressed range
STRESS_YELLOW_LOWER = (20, 30, 100)
STRESS_YELLOW_UPPER = (35, 255, 255)

# Brown/dry range
DRY_BROWN_LOWER = (10, 30, 30)
DRY_BROWN_UPPER = (20, 255, 180)


def analyze_image_colors(image_array):
    """
    Analyze plant health from image pixel data.
    Returns: dict with hydration, wilting_index, chlorophyll, stress_score
    """
    try:
        import cv2
        # Convert to HSV for better color analysis
        hsv = cv2.cvtColor(image_array, cv2.COLOR_BGR2HSV)

        # Calculate green pixel percentage (healthy vegetation)
        green_mask = cv2.inRange(hsv,
            np.array(HEALTHY_GREEN_LOWER),
            np.array(HEALTHY_GREEN_UPPER))
        green_pct = np.count_nonzero(green_mask) / green_mask.size * 100

        # Calculate yellow pixel percentage (stress indicator)
        yellow_mask = cv2.inRange(hsv,
            np.array(STRESS_YELLOW_LOWER),
            np.array(STRESS_YELLOW_UPPER))
        yellow_pct = np.count_nonzero(yellow_mask) / yellow_mask.size * 100

        # Calculate brown pixel percentage (dry/dead tissue)
        brown_mask = cv2.inRange(hsv,
            np.array(DRY_BROWN_LOWER),
            np.array(DRY_BROWN_UPPER))
        brown_pct = np.count_nonzero(brown_mask) / brown_mask.size * 100

        # Estimate brightness variance (wilting = reduced texture/variance)
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        variance = float(np.var(gray))
        wilt_score = max(0, 100 - min(100, variance / 50))

        # Calculate derived scores
        hydration = min(100, max(0, green_pct * 1.2 - yellow_pct * 0.5 - brown_pct))
        chlorophyll = min(100, green_pct * 1.5)
        stress = min(100, yellow_pct * 1.5 + brown_pct * 2 + wilt_score * 0.3)

        return {
            'hydration': round(hydration),
            'wilting_index': round(wilt_score),
            'chlorophyll': round(chlorophyll),
            'stress_score': round(stress),
            'green_pct': round(green_pct, 2),
            'yellow_pct': round(yellow_pct, 2),
            'brown_pct': round(brown_pct, 2),
        }

    except ImportError:
        # Fallback without OpenCV — use basic statistical analysis
        return analyze_without_cv2(image_array)


def analyze_without_cv2(image_array):
    """Fallback analysis using only numpy"""
    # Extract RGB channels
    r_mean = float(np.mean(image_array[:, :, 0]))
    g_mean = float(np.mean(image_array[:, :, 1]))
    b_mean = float(np.mean(image_array[:, :, 2]))

    # Green dominance = healthy
    green_ratio = g_mean / (r_mean + g_mean + b_mean + 1e-6)
    # High red relative to green = stress
    red_ratio = r_mean / (r_mean + g_mean + 1e-6)

    hydration = min(100, green_ratio * 200)
    stress = min(100, red_ratio * 150)
    chlorophyll = min(100, green_ratio * 180)
    wilting = min(100, float(np.std(image_array)) / 2)

    return {
        'hydration': round(hydration),
        'wilting_index': round(wilting),
        'chlorophyll': round(chlorophyll),
        'stress_score': round(stress),
    }


def decode_base64_image(b64_string):
    """Decode base64 image to numpy array"""
    try:
        import cv2
        img_bytes = base64.b64decode(b64_string)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        return cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    except ImportError:
        # Fallback: use PIL
        from PIL import Image
        img_bytes = base64.b64decode(b64_string)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        return np.array(img)


def determine_irrigation_recommendation(analysis):
    """Generate irrigation recommendation from analysis scores"""
    stress = analysis.get('stress_score', 0)
    hydration = analysis.get('hydration', 100)

    if stress > 70 or hydration < 20:
        return {
            'needs_water': True,
            'urgency': 'immediate',
            'recommendation': f'URGENT: Plant shows severe water stress (stress={stress}%). Irrigate immediately with 30L/m².',
            'water_amount_mm': 30,
            'time_window_hours': 1
        }
    elif stress > 40 or hydration < 50:
        return {
            'needs_water': True,
            'urgency': 'soon',
            'recommendation': f'Moderate stress detected (hydration={hydration}%). Irrigate within 4-6 hours, 20L/m².',
            'water_amount_mm': 20,
            'time_window_hours': 6
        }
    else:
        return {
            'needs_water': False,
            'urgency': 'ok',
            'recommendation': f'Plant appears well-hydrated ({hydration}%). No immediate irrigation needed.',
            'water_amount_mm': 0,
            'time_window_hours': 24
        }


@plant_vision_bp.route('/analyze', methods=['POST'])
def analyze_plant():
    """
    POST /api/plant/analyze
    Body: { "image_base64": "..." }
    Returns: plant stress analysis + irrigation recommendation
    """
    data = request.get_json()
    if not data or 'image_base64' not in data:
        return jsonify({'error': 'Missing image_base64 field'}), 400

    try:
        image = decode_base64_image(data['image_base64'])
        if image is None:
            return jsonify({'error': 'Could not decode image'}), 400

        analysis = analyze_image_colors(image)
        recommendation = determine_irrigation_recommendation(analysis)

        return jsonify({
            'success': True,
            'analysis': analysis,
            'recommendation': recommendation,
            'model': 'agromind-plant-vision-v1'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@plant_vision_bp.route('/demo', methods=['GET'])
def demo_analysis():
    """Returns demo analysis for testing without an image"""
    import random
    stress = random.randint(20, 75)
    hydration = random.randint(20, 70)
    analysis = {
        'hydration': hydration,
        'wilting_index': random.randint(10, 60),
        'chlorophyll': random.randint(30, 80),
        'stress_score': stress,
        'green_pct': round(hydration * 0.8, 2),
        'yellow_pct': round(stress * 0.3, 2),
        'brown_pct': round(stress * 0.1, 2),
    }
    return jsonify({
        'success': True,
        'analysis': analysis,
        'recommendation': determine_irrigation_recommendation(analysis),
        'model': 'demo'
    })
