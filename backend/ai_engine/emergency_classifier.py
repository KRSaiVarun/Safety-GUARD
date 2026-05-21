def classify_emergency(anomaly_flags, threat_level, risk_score):
    """Classify the emergency situation for dashboard telemetry."""
    if threat_level == 'high' or risk_score >= 75:
        return 'critical'
    if threat_level == 'medium' or risk_score >= 40:
        return 'elevated'
    if anomaly_flags:
        return 'watch'
    return 'stable'
