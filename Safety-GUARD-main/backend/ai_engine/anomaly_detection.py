from math import sqrt


def detect_anomaly(location_history):
    """Detect unusual movement patterns from recent GPS history."""
    anomalies = []
    if len(location_history) < 3:
        return anomalies

    speeds = []
    for i in range(1, len(location_history)):
        prev = location_history[i - 1]
        curr = location_history[i]
        dt = max((curr.timestamp - prev.timestamp).total_seconds(), 1)
        dx = float(curr.latitude) - float(prev.latitude)
        dy = float(curr.longitude) - float(prev.longitude)
        distance = sqrt(dx * dx + dy * dy) * 111000
        speed = distance / dt
        speeds.append(speed)

    if len(speeds) >= 2:
        avg_speed = sum(speeds) / len(speeds)
        if avg_speed > 8:
            anomalies.append('high_speed')
        if max(speeds) - min(speeds) > 5:
            anomalies.append('sudden_speed_change')

    if any(speed == 0 for speed in speeds[-3:]):
        anomalies.append('stationary_burst')

    return list(set(anomalies))
