from backend.services.alert_service import update_alert_delivery_status


def handle_twilio_status(message_sid: str, message_status: str, recipient: str | None, error_message: str | None, sio=None):
    """Delegate Twilio status handling to alert service."""
    return update_alert_delivery_status(
        message_sid=message_sid,
        message_status=message_status,
        recipient=recipient,
        error_message=error_message,
        sio=sio,
    )
