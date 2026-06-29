import asyncio
from datetime import datetime
from typing import Any
from backend.database.db_config import SessionLocal
from backend.database import models
from backend.services.emergency_state_machine import EmergencyStateMachine


def init_socket_handlers(sio, notifier):
    @sio.event
    async def connect(sid, environ):
        print('client connected', sid)
        # No user context yet; clients should join rooms explicitly

    @sio.event
    async def disconnect(sid):
        print('client disconnected', sid)

    @sio.on('SESSION_STARTED')
    async def session_started(sid, data):
        # data: {session_id, user_id, timestamp}
        await sio.emit('SESSION_STARTED', data, room='dashboard')
        print('SESSION_STARTED', data)
        # persist session
        db = SessionLocal()
        try:
            sess = models.EmergencySession(id=data.get('session_id'), user_id=data.get('user_id'), status='MONITORING')
            db.add(sess)
            db.commit()
            log = models.EmergencyLog(session_id=data.get('session_id'), event_type='SESSION_STARTED', description='Session started')
            db.add(log)
            db.commit()
        finally:
            db.close()

    @sio.on('EMERGENCY_TRIGGERED')
    async def emergency_triggered(sid, data):
        # data: {session_id, user_id, lat, lng, timestamp, contacts}
        print('EMERGENCY_TRIGGERED', data)
        # normalize payload for dashboard clients
        payload = {
            'sessionId': data.get('session_id') or data.get('sessionId'),
            'userId': data.get('user_id') or data.get('userId'),
            'location': {
                'lat': data.get('lat') or (data.get('location') or {}).get('lat'),
                'lng': data.get('lng') or (data.get('location') or {}).get('lng'),
            },
            'timestamp': data.get('timestamp') or data.get('ts') or None,
            'contacts': data.get('contacts', [])
        }
        await sio.emit('EMERGENCY_TRIGGERED', payload, room='dashboard')

        # persist and transition state
        db = SessionLocal()
        try:
            session_id = data.get('session_id') or data.get('sessionId')
            # ensure session exists
            sess = db.query(models.EmergencySession).filter(models.EmergencySession.id == session_id).first()
            if not sess:
                sess = models.EmergencySession(id=session_id, user_id=data.get('user_id') or data.get('userId'), status='MONITORING')
                db.add(sess)
                db.commit()

            # log location
            lat = data.get('lat') or (data.get('location') or {}).get('lat')
            lng = data.get('lng') or (data.get('location') or {}).get('lng')
            if lat is not None and lng is not None:
                loc = models.LiveLocation(session_id=session_id, latitude=lat, longitude=lng, accuracy=data.get('accuracy', None))
                db.add(loc)
                db.commit()

            # state transition to ALERT_QUEUED
            sm = EmergencyStateMachine(sio=sio, notifier=notifier)
            sm.transition(sess, 'ALERT_QUEUED', db)

            # enqueue alert sending via Celery and record QUEUED alerts
            try:
                contacts = data.get('contacts', [])
                payload_task = {'session_id': session_id, 'lat': lat, 'lng': lng, 'contacts': contacts}
                # enqueue task
                from backend.tasks.notification_tasks import send_whatsapp_alert_task
                send_whatsapp_alert_task.delay(payload_task)

                # create QUEUED alert entries
                for phone in contacts:
                    alert = models.Alert(session_id=session_id, recipient_phone=phone, status='QUEUED')
                    db.add(alert)
                db.commit()

                # broadcast ALERT_QUEUED
                await sio.emit('ALERT_QUEUED', {'session_id': session_id, 'recipient_count': len(contacts), 'status': 'QUEUED'}, room='dashboard')
            except Exception as e:
                await sio.emit('ALERT_FAILED', {'session_id': session_id, 'recipient_count': 0, 'status': 'FAILED', 'error': str(e)}, room='dashboard')
        finally:
            db.close()

    @sio.on('LOCATION_UPDATED')
    async def location_updated(sid, data):
        # data may contain session_id, user_id, lat/lng or latitude/longitude
        session_id = data.get('session_id') or data.get('sessionId')
        user_id = data.get('user_id') or data.get('userId')
        lat = data.get('lat') or data.get('latitude') or (data.get('location') or {}).get('lat')
        lng = data.get('lng') or data.get('longitude') or (data.get('location') or {}).get('lng')
        payload = {
            'sessionId': session_id,
            'userId': user_id,
            'lat': lat,
            'lng': lng,
            'latitude': lat,
            'longitude': lng,
            'accuracy': data.get('accuracy'),
            'speed': data.get('speed'),
            'heading': data.get('heading'),
            'battery': data.get('battery'),
            'photoUrl': data.get('photoUrl') if 'photoUrl' in data else data.get('avatar') if 'avatar' in data else None,
            'timestamp': data.get('timestamp') or data.get('ts') or None,
        }
        await sio.emit('LOCATION_UPDATED', payload, room='dashboard')
        db = SessionLocal()
        try:
            if session_id and lat is not None and lng is not None:
                loc = models.LiveLocation(session_id=session_id, latitude=lat, longitude=lng, accuracy=data.get('accuracy'))
                db.add(loc)
                db.commit()
                log = models.EmergencyLog(session_id=session_id, event_type='LOCATION_UPDATED', description=f"Location {lat},{lng}")
                db.add(log)
                db.commit()
        finally:
            db.close()

    # Map common backend task events to dashboard-friendly names
    @sio.on('ALERT_SENT')
    async def on_alert_sent(sid, data):
        await sio.emit('ALERT_SENT', data, room='dashboard')

    @sio.on('ALERT_DELIVERED')
    async def on_alert_delivered(sid, data):
        await sio.emit('ALERT_DELIVERED', data, room='dashboard')

    @sio.on('ALERT_FAILED')
    async def on_alert_failed(sid, data):
        await sio.emit('ALERT_FAILED', data, room='dashboard')

    @sio.on('RISK_CHANGED')
    async def on_risk_changed(sid, data):
        # normalize payload and re-emit as RISK_SCORED
        payload = {
            'sessionId': data.get('session_id') or data.get('sessionId'),
            'score': data.get('new_risk') or data.get('score'),
            'level': data.get('level') or data.get('classification') or 'UNKNOWN',
            'recommendation': data.get('recommendation', ''),
        }
        await sio.emit('RISK_SCORED', payload, room='dashboard')

    @sio.on('SESSION_STATE_CHANGED')
    async def on_session_state_changed(sid, data):
        await sio.emit('STATE_CHANGED', data, room='dashboard')

    @sio.on('join_dashboard')
    async def join_dashboard(sid, data=None):
        """Client requests to join the dashboard room; send DASHBOARD_SYNC."""
        await sio.enter_room(sid, 'dashboard')
        print('sid joined dashboard', sid)
        # build a simple dashboard sync payload
        try:
            from backend.services.emergency_service import get_active_sessions
            active_sessions = get_active_sessions()
            active_users = list({s['user_id'] for s in active_sessions})
            # current risk scores map
            current_risks = {s['session_id']: s.get('risk_score', 0) for s in active_sessions}
            payload = {
                'activeUsers': active_users,
                'activeEmergencies': [s for s in active_sessions if s.get('status') != 'RESOLVED'],
                'activeSessions': active_sessions,
                'currentRiskScores': current_risks,
            }
            await sio.emit('DASHBOARD_SYNC', payload, room=sid)
        except Exception as e:
            print('dashboard sync error', e)

    @sio.on('join_session')
    async def join_session(sid, data):
        # data: {session_id}
        session_id = data.get('session_id') if isinstance(data, dict) else None
        if session_id:
            room1 = f'session:{session_id}'
            room2 = f'session_{session_id}'
            await sio.enter_room(sid, room1)
            await sio.enter_room(sid, room2)
            print(f'sid {sid} joined {room1} and {room2}')

    @sio.on('leave_session')
    async def leave_session(sid, data):
        session_id = data.get('session_id') if isinstance(data, dict) else None
        if session_id:
            room = f'session:{session_id}'
            await sio.leave_room(sid, room)
            print(f'sid {sid} left {room}')

    @sio.on('user_online')
    async def user_online(sid, data):
        # data: {user_id}
        user_id = data.get('user_id') if isinstance(data, dict) else None
        if user_id:
            await sio.emit('USER_ONLINE', {'userId': user_id}, room='dashboard')

    @sio.on('user_offline')
    async def user_offline(sid, data):
        user_id = data.get('user_id') if isinstance(data, dict) else None
        if user_id:
            await sio.emit('USER_OFFLINE', {'userId': user_id}, room='dashboard')

    # Compatibility alias: accept older SOS_TRIGGERED events and re-emit standardized EMERGENCY_TRIGGERED
    @sio.on('SOS_TRIGGERED')
    async def sos_alias(sid, data):
        try:
            session_id = data.get('session_id') or data.get('sessionId')
            user_id = data.get('user_id') or data.get('userId')
            lat = data.get('lat') or data.get('latitude') or (data.get('location') or {}).get('lat')
            lng = data.get('lng') or data.get('longitude') or (data.get('location') or {}).get('lng')
            payload = {
                'sessionId': session_id,
                'userId': user_id,
                'location': {'lat': lat, 'lng': lng},
                'timestamp': data.get('timestamp') or data.get('ts') or None,
                'contacts': data.get('contacts', []),
            }
            await sio.emit('EMERGENCY_TRIGGERED', payload, room='dashboard')
        except Exception as e:
            print('sos_alias error', e)
