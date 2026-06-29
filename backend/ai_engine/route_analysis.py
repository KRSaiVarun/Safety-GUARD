def route_risk_score(location_history):
    """Estimate route risk from GPS history and deviation patterns."""
    if len(location_history) < 2:
        return 0.0

    total_change = 0.0
    for i in range(2, len(location_history)):
        prev = location_history[i - 1]
        curr = location_history[i]
        last = location_history[i - 2]
        # rough heuristic for zig-zag or off-route
        dx1 = float(prev.latitude) - float(last.latitude)
        dy1 = float(prev.longitude) - float(last.longitude)
        dx2 = float(curr.latitude) - float(prev.latitude)
        dy2 = float(curr.longitude) - float(prev.longitude)
        bend = abs(dx1 - dx2) + abs(dy1 - dy2)
        total_change += bend

    score = min((total_change / len(location_history)) * 1000, 50.0)
    return score
