import pytest
from types import SimpleNamespace
from backend.services.alert_service import AlertService
from backend.database import models


def create_session(db_session, status='ALERT_SENT'):
    session = models.EmergencySession(status=status)
    db_session.add(session)
    db_session.commit()
    return session


def test_create_alert_persists_default_status(db_session):
    session = create_session(db_session, status='ALERT_QUEUED')
    service = AlertService(db=db_session)

    alert = service.create_alert(session.id, '+15551234567')

    assert alert.id is not None
    assert alert.session_id == session.id
    assert alert.recipient_phone == '+15551234567'
    assert alert.status == 'QUEUED'
    assert alert.provider_message_id is None
    assert alert.sent_at is not None

    fetched = db_session.query(models.Alert).filter(models.Alert.id == alert.id).first()
    assert fetched is not None
    assert fetched.status == 'QUEUED'


def test_update_alert_status_applies_valid_transition_and_provider_id(db_session):
    session = create_session(db_session)
    alert = models.Alert(session_id=session.id, recipient_phone='+15551234567', status='PROCESSING')
    db_session.add(alert)
    db_session.commit()

    service = AlertService(db=db_session)
    response = SimpleNamespace(sid='SM123')
    service.update_alert_status(alert, 'SENT', response)

    db_session.refresh(alert)
    assert alert.status == 'SENT'
    assert alert.provider_message_id == 'SM123'


def test_update_alert_status_disallows_invalid_regression(db_session):
    session = create_session(db_session)
    alert = models.Alert(session_id=session.id, recipient_phone='+15551234567', status='DELIVERED')
    db_session.add(alert)
    db_session.commit()

    service = AlertService(db=db_session)

    with pytest.raises(ValueError, match='Invalid alert transition DELIVERED -> QUEUED'):
        service.update_alert_status(alert, 'QUEUED')


def test_persist_delivery_log_writes_log_entry(db_session):
    session = create_session(db_session)
    service = AlertService(db=db_session)

    log = service.persist_delivery_log(
        session_id=session.id,
        alert_id=123,
        message_sid='SM123',
        delivery_status='DELIVERED',
        recipient='+15551234567',
        error_message=None,
        retry_count=2,
    )

    assert log.id is not None
    assert log.session_id == session.id
    assert log.alert_id == 123
    assert log.provider_message_id == 'SM123'
    assert log.delivery_status == 'DELIVERED'
    assert log.provider == 'twilio'
    assert log.recipient == '+15551234567'
    assert log.retry_count == 2


def test_map_twilio_status_maps_webhook_codes(db_session):
    service = AlertService(db=db_session)

    assert service.map_twilio_status('delivered') == ('DELIVERED', 'ALERT_DELIVERED', 'ALERT_DELIVERED')
    assert service.map_twilio_status('read') == ('READ', 'ALERT_READ', 'ALERT_READ')
    assert service.map_twilio_status('failed') == ('FAILED', 'ALERT_FAILED', 'ALERT_FAILED')
    assert service.map_twilio_status('undelivered') == ('UNDELIVERED', 'ALERT_FAILED', 'ALERT_FAILED')
    assert service.map_twilio_status('sending_failed') == ('SENDING_FAILED', 'ALERT_FAILED', 'ALERT_FAILED')
    assert service.map_twilio_status(None) == ('UNKNOWN', None, 'ALERT_STATUS')


def test_emit_alert_event_routes_to_socketio(mock_sio, db_session):
    service = AlertService(db=db_session, sio=mock_sio)

    service.emit_alert_event('ALERT_SENT', {'session_id': 'abc'})

    assert mock_sio.emitted == [('ALERT_SENT', {'session_id': 'abc'}, 'dashboard')]


def test_update_alert_delivery_status_writes_log_and_transitions_session(db_session, mock_sio):
    session = create_session(db_session, status='ALERT_SENT')
    alert = models.Alert(session_id=session.id, recipient_phone='+15551234567', status='SENT', provider_message_id='SM123')
    db_session.add(alert)
    db_session.commit()

    service = AlertService(db=db_session, sio=mock_sio)
    result = service.update_alert_delivery_status('SM123', 'delivered', None, None)

    assert result['received'] is True
    assert result['status'] == 'DELIVERED'

    db_session.refresh(alert)
    assert alert.status == 'DELIVERED'

    delivery_log = db_session.query(models.AlertDeliveryLog).filter(models.AlertDeliveryLog.provider_message_id == 'SM123').first()
    assert delivery_log is not None
    assert delivery_log.delivery_status == 'DELIVERED'
    assert delivery_log.recipient == '+15551234567'

    assert mock_sio.emitted == [
        (
            'ALERT_DELIVERED',
            {
                'session_id': str(session.id),
                'recipient': '+15551234567',
                'status': 'DELIVERED',
                'error_message': None,
                'message_sid': 'SM123',
            },
            'dashboard',
        )
    ]

    db_session.refresh(session)
    assert session.status == 'ALERT_DELIVERED'
