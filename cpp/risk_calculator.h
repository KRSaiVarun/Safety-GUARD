#pragma once
#include <vector>

namespace safeguard {

// ─── Data structures ──────────────────────────────────────────────────────────

struct GPSPoint {
    double lat;
    double lon;
    double accuracy;
    double timestamp;   // Unix seconds
};

struct GeoVertex {
    double lat;
    double lon;
};

enum class RiskLevel {
    LOW = 0,
    MEDIUM,
    HIGH,
    CRITICAL,
};

struct RiskResult {
    double    score;        // 0–100
    RiskLevel level;
    double    confidence;   // 0–1
};

// ─── Function declarations ────────────────────────────────────────────────────

double     haversine(double lat1, double lon1, double lat2, double lon2);
double     compute_speed(double lat1, double lon1, double lat2, double lon2, double delta_seconds);
double     velocity_anomaly_score(double speed_mps);
std::vector<double> smooth_risk_series(const std::vector<double>& raw_scores);
RiskResult compute_risk_score(const GPSPoint& current, const GPSPoint* previous,
                               double hour_of_day, double historical_avg);
RiskLevel  classify_risk(double score);
bool       point_in_polygon(double lat, double lon, const std::vector<GeoVertex>& polygon);

} // namespace safeguard
