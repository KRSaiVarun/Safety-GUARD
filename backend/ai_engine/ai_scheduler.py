from backend.database.db_config import SessionLocal
from backend.database import models
from backend.services.emergency_state_machine import EmergencyStateMachine
from backend.ai_engine.risk_scoring import calculate_risk
from backend.ai_engine.anomaly_detection import detect_anomaly
from backend.ai_engine.inactivity_detection import inactivity_duration
from backend.ai_engine.route_analysis import route_risk_score
from backend.ai_engine.threat_prediction import threat_classification
from backend.ai_engine.emergency_classifier import classify_emergency
from datetime import datetime
from socketio import Client
import os

BACKEND_SOCKET_URL = os.getenv('BACKEND_SOCKET_URL', 'http://backend:8000')


def analyze_session(session_obj, locations):
    inactivity = inactivity_duration(locations)
    anomalies = detect_anomaly(locations)
    route_risk = route_risk_score(locations)
    threat_level = threat_classification(anomalies, inactivity, route_risk)
    risk_score = calculate_risk({
        'inactivity_duration': inactivity,
        'anomaly_detected': bool(anomalies),
        'history_risk': route_risk,
        'sos_triggered': session_obj.status not in ['IDLE'],
        'threat_level': threat_level,
    })
    classification = classify_emergency(anomalies, threat_level, risk_score)
    return {
        'risk_score': risk_score,
        'inactivity_duration': inactivity,
        'anomalies': anomalies,
        'route_risk': route_risk,
        'threat_level': threat_level,
        'classification': classification,
    }


def emit_socket_event(event, payload):
    socket = None
    try:
        socket = Client()
        socket.connect(BACKEND_SOCKET_URL)
        socket.emit(event, payload)
    except Exception:
        pass
    finally:
        if socket:
            try:
                socket.disconnect()
            except Exception:
                pass


def run_risk_analysis():
    db = SessionLocal()
    try:
        active_sessions = db.query(models.EmergencySession).filter(models.EmergencySession.status != 'RESOLVED').all()
        for session_obj in active_sessions:
            locations = db.query(models.LiveLocation).filter(models.LiveLocation.session_id == session_obj.id).order_by(models.LiveLocation.timestamp.asc()).all()
            if not locations:
                continue

            analysis = analyze_session(session_obj, locations)
            old_score = session_obj.risk_score
            session_obj.risk_score = analysis['risk_score']
            db.add(session_obj)
            db.commit()

            ai_event = models.AIEvent(
                session_id=session_obj.id,
                event_type='risk_change',
                value=analysis['risk_score'],
                metadata={
                    'inactivity_duration': analysis['inactivity_duration'],
                    'anomalies': analysis['anomalies'],
                    'route_risk': analysis['route_risk'],
                    'threat_level': analysis['threat_level'],
                    'classification': analysis['classification'],
                },
            )
            db.add(ai_event)
            db.commit()

            if analysis['risk_score'] != old_score:
                emit_socket_event('RISK_CHANGED', {
                    'session_id': str(session_obj.id),
                    'old_risk': old_score,
                    'new_risk': analysis['risk_score'],
                    'classification': analysis['classification'],
                    'threat_level': analysis['threat_level'],
                })

            if session_obj.status == 'MONITORING' and analysis['risk_score'] >= 40:
                sm = EmergencyStateMachine(sio=None, notifier=None)
                try:
                    sm.transition(session_obj, 'RISK_DETECTED', db, emit=False)
                    emit_socket_event('SESSION_STATE_CHANGED', {
                        'session_id': str(session_obj.id),
                        'old_state': 'MONITORING',
                        'new_state': 'RISK_DETECTED',
                    })
                except Exception:
                    pass
    finally:
        db.close()
