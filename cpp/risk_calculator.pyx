# distutils: language = c++
# distutils: sources = risk_calculator.cpp geofence.cpp
# cython: language_level = 3
"""
Safety-GUARD — Cython Wrapper for C++ Risk Engine

Exposes the high-performance C++ risk calculation and geofence modules
to Python with a clean, Pythonic API.

Compile with:
    python setup.py build_ext --inplace
"""

from libcpp.vector cimport vector
from libcpp cimport bool as cbool

# ─── C++ declarations ─────────────────────────────────────────────────────────

cdef extern from "risk_calculator.h" namespace "safeguard":
    cdef enum class RiskLevel:
        LOW
        MEDIUM
        HIGH
        CRITICAL

    cdef struct GPSPoint:
        double lat
        double lon
        double accuracy
        double timestamp

    cdef struct RiskResult:
        double    score
        RiskLevel level
        double    confidence

    double haversine(double lat1, double lon1, double lat2, double lon2)
    double velocity_anomaly_score(double speed_mps)
    vector[double] smooth_risk_series(const vector[double]& raw_scores)
    RiskResult compute_risk_score(const GPSPoint& current,
                                   const GPSPoint* previous,
                                   double hour_of_day,
                                   double historical_avg)

cdef extern from "geofence.h" namespace "safeguard":
    cdef struct CircularZone:
        double centre_lat
        double centre_lon
        double radius_m

    double compute_route_deviation(double lat, double lon,
                                    const vector[GPSPoint]& route,
                                    double max_deviation_m)

    double detect_stillness_duration(const vector[GPSPoint]& trail,
                                      double radius_m)

# ─── Python-facing API ────────────────────────────────────────────────────────

_LEVEL_MAP = {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "CRITICAL"}


def haversine_distance(double lat1, double lon1, double lat2, double lon2) -> float:
    """Return great-circle distance in metres between two GPS coordinates."""
    return haversine(lat1, lon1, lat2, lon2)


def velocity_score(double speed_mps) -> float:
    """Return anomaly score (0–100) for a given speed in m/s."""
    return velocity_anomaly_score(speed_mps)


def smooth_scores(list raw_scores) -> list:
    """Apply Exponential Moving Average smoothing to a list of risk scores."""
    cdef vector[double] cpp_scores = raw_scores
    cdef vector[double] result = smooth_risk_series(cpp_scores)
    return list(result)


def calculate_risk(dict current_pt, dict previous_pt = None,
                   double hour_of_day = 12.0,
                   double historical_avg = 20.0) -> dict:
    """
    Compute composite risk score for a GPS location.

    Args:
        current_pt:     {"lat": float, "lon": float, "accuracy": float, "timestamp": float}
        previous_pt:    Same structure, or None if first point.
        hour_of_day:    0–23 (used for time-of-day weighting).
        historical_avg: User's baseline average risk score.

    Returns:
        {"score": float, "level": str, "confidence": float}
    """
    cdef GPSPoint current
    current.lat       = current_pt["lat"]
    current.lon       = current_pt["lon"]
    current.accuracy  = current_pt.get("accuracy", 10.0)
    current.timestamp = current_pt["timestamp"]

    cdef RiskResult res

    if previous_pt is None:
        res = compute_risk_score(current, NULL, hour_of_day, historical_avg)
    else:
        cdef GPSPoint prev
        prev.lat       = previous_pt["lat"]
        prev.lon       = previous_pt["lon"]
        prev.accuracy  = previous_pt.get("accuracy", 10.0)
        prev.timestamp = previous_pt["timestamp"]
        res = compute_risk_score(current, &prev, hour_of_day, historical_avg)

    return {
        "score":      res.score,
        "level":      _LEVEL_MAP.get(<int>res.level, "LOW"),
        "confidence": res.confidence,
    }


def route_deviation_score(double lat, double lon, list route_points,
                           double max_deviation_m = 200.0) -> float:
    """
    Score how far (0–100) the user has deviated from their expected route.
    """
    cdef vector[GPSPoint] cpp_route
    cdef GPSPoint pt
    for p in route_points:
        pt.lat       = p["lat"]
        pt.lon       = p["lon"]
        pt.accuracy  = p.get("accuracy", 10.0)
        pt.timestamp = p.get("timestamp", 0.0)
        cpp_route.push_back(pt)

    return compute_route_deviation(lat, lon, cpp_route, max_deviation_m)


def stillness_seconds(list gps_trail, double radius_m = 20.0) -> float:
    """
    Return how many seconds the user has been stationary within radius_m.
    """
    cdef vector[GPSPoint] cpp_trail
    cdef GPSPoint pt
    for p in gps_trail:
        pt.lat       = p["lat"]
        pt.lon       = p["lon"]
        pt.accuracy  = p.get("accuracy", 10.0)
        pt.timestamp = p["timestamp"]
        cpp_trail.push_back(pt)

    return detect_stillness_duration(cpp_trail, radius_m)
