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

    @sio.on('SOS_TRIGGERED')
    async def sos_triggered(sid, data):
        # data: {session_id, lat, lng, timestamp, contacts}
        print('SOS_TRIGGERED', data)
        await sio.emit('SOS_TRIGGERED', data, room='dashboard')

        # persist and transition state
        db = SessionLocal()
        try:
            session_id = data.get('session_id')
            # ensure session exists
            sess = db.query(models.EmergencySession).filter(models.EmergencySession.id == session_id).first()
            if not sess:
                sess = models.EmergencySession(id=session_id, user_id=data.get('user_id'), status='MONITORING')
                db.add(sess)
                db.commit()

            # log location
            loc = models.LiveLocation(session_id=session_id, latitude=data.get('lat'), longitude=data.get('lng'), accuracy=data.get('accuracy', None))
            db.add(loc)
            db.commit()

            # state transition to ALERT_QUEUED
            sm = EmergencyStateMachine(sio=sio, notifier=notifier)
            sm.transition(sess, 'ALERT_QUEUED', db)

            # enqueue alert sending via Celery and record QUEUED alerts
            try:
                contacts = data.get('contacts', [])
                payload = {'session_id': session_id, 'lat': data.get('lat'), 'lng': data.get('lng'), 'contacts': contacts}
                # enqueue task
                from backend.tasks.notification_tasks import send_whatsapp_alert_task
                send_whatsapp_alert_task.delay(payload)

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
        # data: {session_id, lat, lng, accuracy}
        await sio.emit('LOCATION_UPDATED', data, room='dashboard')
        db = SessionLocal()
        try:
            loc = models.LiveLocation(session_id=data.get('session_id'), latitude=data.get('lat'), longitude=data.get('lng'), accuracy=data.get('accuracy'))
            db.add(loc)
            db.commit()
            log = models.EmergencyLog(session_id=data.get('session_id'), event_type='LOCATION_UPDATED', description=f"Location {data.get('lat')},{data.get('lng')}")
            db.add(log)
            db.commit()
        finally:
            db.close()
