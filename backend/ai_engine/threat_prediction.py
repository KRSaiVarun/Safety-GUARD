def threat_classification(anomalies, inactivity_seconds, route_risk):
    """Return a threat classification based on combined AI signals."""
    if 'high_speed' in anomalies and inactivity_seconds > 30:
        return 'high'
    if route_risk > 30 or 'sudden_speed_change' in anomalies:
        return 'medium'
    if inactivity_seconds > 60:
        return 'medium'
    return 'low'
