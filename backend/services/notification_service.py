import os
from datetime import datetime, timezone
from typing import Dict
import os

from twilio.rest import Client


def _utcnow():
    return datetime.now(timezone.utc)


class NotificationService:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_whatsapp = os.getenv('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
        self.status_callback_url = os.getenv('TWILIO_STATUS_CALLBACK_URL')
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None

    def send_whatsapp_alert(self, emergency_session: Dict):
        lat = emergency_session.get('lat')
        lng = emergency_session.get('lng')
        session_id = emergency_session.get('session_id')
        timestamp = _utcnow().isoformat()
        contacts = emergency_session.get('contacts', [])

        message_body = (
            "🚨 SAFETY-GUARD EMERGENCY ALERT 🚨\n\n"
            f"📍 Live Location:\nhttps://maps.google.com/?q={lat},{lng}\n\n"
            f"Session ID: {session_id}\nTime: {timestamp}\n\n"
            "Please respond immediately."
        )

        results = []
        for phone in contacts:
            to = f'whatsapp:{phone}'
            try:
                if self.client:
                    kwargs = {
                        'body': message_body,
                        'from_': self.from_whatsapp,
                        'to': to,
                    }
                    if self.status_callback_url:
                        kwargs['status_callback'] = f"{self.status_callback_url}?session_id={session_id}&recipient={phone}"
                    resp = self.client.messages.create(**kwargs)
                    results.append({'to': phone, 'status': 'sent', 'sid': resp.sid})
                else:
                    results.append({'to': phone, 'status': 'skipped', 'reason': 'no twilio creds'})
            except Exception as e:
                results.append({'to': phone, 'status': 'failed', 'error': str(e)})

        return results
