"""Notification Service - sends alerts via multiple channels."""
from sqlalchemy.orm import Session
from app.models import EmergencyAlert, EmergencySession
from app.config import settings
from uuid import UUID
from datetime import datetime, timezone
import logging
import asyncio
try:
    from twilio.rest import Client
except ImportError:
    Client = None

logger = logging.getLogger(__name__)


class NotificationService:
    """Manages emergency notifications."""

    def __init__(self):
        """Initialize Twilio client."""
        if Client is not None and settings.twilio_account_sid and settings.twilio_auth_token:
            account_sid = settings.twilio_account_sid
            auth_token = settings.twilio_auth_token
            assert account_sid is not None and auth_token is not None
            self.twilio_client = Client(account_sid, auth_token)
        else:
            self.twilio_client = None
            logger.warning("Twilio credentials not configured")

    async def send_emergency_alert(
        self,
        db: Session,
        session_id: UUID,
        phone_numbers: list[str],
        location_link: str,
        message: str = None
    ) -> list[EmergencyAlert]:
        """Send emergency alert to multiple recipients."""

        if not message:
            message = (
                f"🚨 EMERGENCY ALERT 🚨\n\n"
                f"I am in danger and need immediate help!\n\n"
                f"📍 My Current Location:\n{location_link}\n\n"
                f"Please contact me urgently or inform authorities.\n"
                f"— Safety Guard System"
            )

        alerts = []

        for phone_number in phone_numbers:
            alert = EmergencyAlert(
                session_id=session_id,
                alert_type="SMS",
                recipient_number=phone_number,
                message_content=message,
                location_link=location_link,
            )
            db.add(alert)

            # Try to send immediately
            try:
                success = await self._send_sms(phone_number, message)
                if success:
                    setattr(alert, 'is_sent', True)
                    setattr(alert, 'sent_at', datetime.now(timezone.utc))
                    setattr(alert, 'response_status', "SENT")
                    logger.info("SMS sent to %s", phone_number)
                else:
                    current_attempts = int(alert.send_attempts or 0)
                    setattr(alert, 'send_attempts', current_attempts + 1)
                    setattr(alert, 'error_message', "SMS send failed")
            except Exception as e:
                current_attempts = int(alert.send_attempts or 0)
                setattr(alert, 'send_attempts', current_attempts + 1)
                setattr(alert, 'error_message', str(e))
                logger.exception("Error sending SMS to %s", phone_number)

            alerts.append(alert)

        db.commit()

        # Update session alert count
        session = db.query(EmergencySession).filter(
            EmergencySession.id == session_id
        ).first()
        if session:
            current_count = int(session.alerts_sent_count or 0)
            setattr(session, 'alerts_sent_count', current_count + len(alerts))
            db.commit()

        return alerts

    async def _send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS via Twilio."""
        if not self.twilio_client:
            logger.warning(f"Twilio not configured, simulating SMS to {phone_number}")
            return True

        try:
            msg = await asyncio.to_thread(
                self.twilio_client.messages.create,
                body=message,
                from_=settings.twilio_phone_number,
                to=phone_number
            )
            logger.info("SMS sent: %s", msg.sid)
            return True
        except Exception:
            logger.exception("Twilio error")
            return False

    async def send_whatsapp_alert(
        self,
        db: Session,
        session_id: UUID,
        phone_numbers: list[str],
        location_link: str
    ) -> list[EmergencyAlert]:
        """Send WhatsApp alert."""
        await asyncio.sleep(0)
        logger.info(
            "WhatsApp alert feature coming soon for session %s db=%s recipients=%s location=%s",
            session_id,
            db,
            len(phone_numbers),
            location_link
        )
        return []

    async def send_email_alert(
        self,
        db: Session,
        session_id: UUID,
        email_addresses: list[str],
        location_link: str
    ) -> list[EmergencyAlert]:
        """Send email alert."""
        await asyncio.sleep(0)
        logger.info(
            "Email alert feature coming soon for session %s db=%s recipients=%s location=%s",
            session_id,
            db,
            len(email_addresses),
            location_link
        )
        return []

    async def retry_failed_alerts(
        self,
        db: Session,
        session_id: UUID,
        max_retries: int = 3
    ) -> None:
        """Retry sending failed alerts."""
        failed_alerts = db.query(EmergencyAlert).filter(
            EmergencyAlert.session_id == session_id,
            EmergencyAlert.is_sent == False,
            EmergencyAlert.send_attempts < max_retries
        ).all()

        for alert in failed_alerts:
            try:
                recipient_number = str(alert.recipient_number)
                message_content = str(alert.message_content)
                success = await self._send_sms(
                    recipient_number,
                    message_content
                )
                if success:
                    setattr(alert, 'is_sent', True)
                    setattr(alert, 'sent_at', datetime.now(timezone.utc))
                    setattr(alert, 'response_status', "SENT")
                else:
                    current_attempts = int(alert.send_attempts or 0)
                    setattr(alert, 'send_attempts', current_attempts + 1)
            except Exception as e:
                current_attempts = int(alert.send_attempts or 0)
                setattr(alert, 'send_attempts', current_attempts + 1)
                setattr(alert, 'error_message', str(e))
                logger.exception("Retry error for alert %s", alert.id)

        db.commit()


# Global notification service instance
notification_service = NotificationService()
