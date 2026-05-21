def inactivity_duration(location_history):
    """Return inactivity duration in seconds based on GPS movement."""
    if len(location_history) < 2:
        return 0
    last = location_history[-1]
    prev = location_history[-2]
    dx = float(last.latitude) - float(prev.latitude)
    dy = float(last.longitude) - float(prev.longitude)
    distance = (dx * dx + dy * dy) ** 0.5 * 111000
    if distance < 10:
        return (last.timestamp - prev.timestamp).total_seconds()
    return 0
