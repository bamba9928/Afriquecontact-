import requests
from django.conf import settings


def send_whatsapp_otp(phone, code):
    if settings.DEBUG:
        print(f"--- OTP MOCK pour {phone}: {code} ---")
        return True

    url = f"https://graph.facebook.com/v17.0/{settings.WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": "auth_otp",  # Template validé dans Meta Business Manager
            "language": {"code": "fr"},
            "components": [{
                "type": "body",
                "parameters": [{"type": "text", "text": code}]
            }]
        }
    }
    try:
        requests.post(url, json=data, headers=headers)
    except Exception as e:
        # Log erreur
        pass