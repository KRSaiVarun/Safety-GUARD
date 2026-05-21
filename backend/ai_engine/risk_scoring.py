def calculate_risk(session_data: dict) -> int:
    score = 0

    inactivity = session_data.get('inactivity_duration', 0)
    if inactivity > 60:
        score += 30
    elif inactivity > 30:
        score += 15

    if session_data.get('anomaly_detected'):
        score += 25

    if session_data.get('sos_triggered'):
        score += 35

    history_risk = session_data.get('history_risk', 0)
    score += int(history_risk * 0.2)

    threat = session_data.get('threat_level', 'low')
    if threat == 'high':
        score += 20
    elif threat == 'medium':
        score += 10

    return min(score, 100)
