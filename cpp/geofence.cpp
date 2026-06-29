/**
 * Safety-GUARD — Geofence & Route Analysis (C++)
 *
 * Implements:
 *   - Safe zone management (circular + polygon geofences)
 *   - Route deviation detection
 *   - Movement pattern analysis
 *   - Nearest safe zone lookup (k-nearest using Haversine)
 */

#include "geofence.h"
#include "risk_calculator.h"
#include <cmath>
#include <algorithm>
#include <limits>

namespace safeguard {

// ─── Circular geofence test ───────────────────────────────────────────────────
bool CircularZone::contains(double lat, double lon) const {
    double dist = haversine(centre_lat, centre_lon, lat, lon);
    return dist <= radius_m;
}

double CircularZone::distance_to_edge(double lat, double lon) const {
    double dist = haversine(centre_lat, centre_lon, lat, lon);
    return std::max(0.0, dist - radius_m);
}

// ─── GeofenceManager ─────────────────────────────────────────────────────────
void GeofenceManager::add_safe_zone(CircularZone zone) {
    safe_zones_.push_back(std::move(zone));
}

// Returns true if the point is inside ANY registered safe zone
bool GeofenceManager::is_in_safe_zone(double lat, double lon) const {
    for (const auto& zone : safe_zones_) {
        if (zone.contains(lat, lon)) return true;
    }
    return false;
}

// Returns distance (metres) to the nearest safe zone boundary, 0 if inside one
double GeofenceManager::distance_to_nearest_safe_zone(double lat, double lon) const {
    double min_dist = std::numeric_limits<double>::max();
    for (const auto& zone : safe_zones_) {
        double d = zone.distance_to_edge(lat, lon);
        min_dist = std::min(min_dist, d);
    }
    return (min_dist == std::numeric_limits<double>::max()) ? -1.0 : min_dist;
}

// ─── Route deviation score ────────────────────────────────────────────────────
// Computes how far the current position deviates from the expected route.
// Expected route is a sequence of waypoints.
// Returns a deviation score 0–100 (0 = on route, 100 = maximum deviation).
double compute_route_deviation(double current_lat, double current_lon,
                                const std::vector<GPSPoint>& expected_route,
                                double max_deviation_m) {
    if (expected_route.empty()) return 0.0;

    // Find minimum distance to any segment of the expected route
    double min_dist = std::numeric_limits<double>::max();

    for (size_t i = 0; i + 1 < expected_route.size(); ++i) {
        // Approximate distance from point to line segment using midpoint
        double seg_lat = (expected_route[i].lat + expected_route[i+1].lat) / 2.0;
        double seg_lon = (expected_route[i].lon + expected_route[i+1].lon) / 2.0;
        double d = haversine(current_lat, current_lon, seg_lat, seg_lon);
        min_dist = std::min(min_dist, d);
    }

    if (min_dist == std::numeric_limits<double>::max()) {
        min_dist = haversine(current_lat, current_lon,
                              expected_route[0].lat, expected_route[0].lon);
    }

    double score = (min_dist / max_deviation_m) * 100.0;
    return std::min(score, 100.0);
}

// ─── Stillness detector ───────────────────────────────────────────────────────
// Returns the number of seconds the user has been stationary (within radius_m).
double detect_stillness_duration(const std::vector<GPSPoint>& trail,
                                  double radius_m) {
    if (trail.size() < 2) return 0.0;

    const GPSPoint& anchor = trail.back();
    double duration = 0.0;

    for (int i = static_cast<int>(trail.size()) - 2; i >= 0; --i) {
        double dist = haversine(trail[i].lat, trail[i].lon,
                                 anchor.lat,  anchor.lon);
        if (dist > radius_m) break;
        duration = anchor.timestamp - trail[i].timestamp;
    }
    return duration;
}

} // namespace safeguard
