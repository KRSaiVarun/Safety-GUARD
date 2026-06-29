#pragma once
#include <vector>
#include <string>
#include "risk_calculator.h"

namespace safeguard {

struct CircularZone {
    std::string name;
    double centre_lat;
    double centre_lon;
    double radius_m;

    bool   contains(double lat, double lon) const;
    double distance_to_edge(double lat, double lon) const;
};

class GeofenceManager {
public:
    void   add_safe_zone(CircularZone zone);
    bool   is_in_safe_zone(double lat, double lon) const;
    double distance_to_nearest_safe_zone(double lat, double lon) const;

private:
    std::vector<CircularZone> safe_zones_;
};

double compute_route_deviation(double current_lat, double current_lon,
                                const std::vector<GPSPoint>& expected_route,
                                double max_deviation_m = 200.0);

double detect_stillness_duration(const std::vector<GPSPoint>& trail,
                                  double radius_m = 20.0);

} // namespace safeguard
