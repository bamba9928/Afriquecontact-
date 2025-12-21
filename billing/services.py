from __future__ import annotations

import hmac
import hashlib
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional
from urllib.parse import urlencode

from django.utils.crypto import constant_time_compare

try:
    import requests
except Exception:  # noqa
    requests = None


@dataclass(frozen=True)
class BictorysConfig:
    mock: bool
    base_url: str
    api_key: str
    webhook_secret: str
    success_url: str
    cancel_url: str


def get_bictorys_config() -> BictorysConfig:
    return BictorysConfig(
        mock=os.getenv("BICTORYS_MOCK", "true").lower() in ("1", "true", "yes"),
        base_url=os.getenv("BICTORYS_BASE_URL", "").rstrip("/"),
        api_key=os.getenv("BICTORYS_API_KEY", ""),
        webhook_secret=os.getenv("BICTORYS_WEBHOOK_SECRET", ""),
        success_url=os.getenv("CHECKOUT_SUCCESS_URL", "http://localhost:3000/payment/success"),
        cancel_url=os.getenv("CHECKOUT_CANCEL_URL", "http://localhost:3000/payment/cancel"),
    )


def bictorys_create_checkout(
    *,
    reference: str,
    amount: int,
    currency: str,
    customer_phone: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Crée un paiement côté provider.
    On envoie `reference` (= Payment.provider_ref) pour pouvoir retrouver le paiement au webhook.
    """
    cfg = get_bictorys_config()

    if cfg.mock:
        q = urlencode({"ref": reference, "amount": amount})
        return {
            "checkout_url": f"{cfg.success_url}?{q}",
            "provider_payload": {"mock": True, "reference": reference},
        }

    if requests is None:
        raise RuntimeError("Le package 'requests' est requis pour Bictorys (pip install requests).")

    if not cfg.base_url or not cfg.api_key:
        raise RuntimeError("BICTORYS_BASE_URL / BICTORYS_API_KEY manquants.")

    # Endpoint à adapter selon Bictorys (ex: /pay/v1/charges)
    url = f"{cfg.base_url}/pay/v1/charges"

    payload = {
        "reference": reference,
        "amount": amount,
        "currency": currency,
        "customer": {"phone": customer_phone},
        "redirect_urls": {"success": cfg.success_url, "cancel": cfg.cancel_url},
        "metadata": metadata or {},
    }

    headers = {
        "Authorization": f"Bearer {cfg.api_key}",
        "Content-Type": "application/json",
    }

    r = requests.post(url, json=payload, headers=headers, timeout=20)
    r.raise_for_status()
    data = r.json()

    checkout_url = data.get("checkout_url") or data.get("payment_url") or data.get("url")
    if not checkout_url:
        raise RuntimeError("Réponse Bictorys invalide: checkout_url introuvable.")

    return {"checkout_url": checkout_url, "provider_payload": data}


def verify_bictorys_signature(raw_body: bytes, signature: str) -> bool:
    """
    Vérif HMAC SHA256 sur le body brut.
    Header attendu: X-Bictorys-Signature (ou équivalent).
    Format accepté: "sha256=<hex>" ou "<hex>".
    """
    cfg = get_bictorys_config()
    if not cfg.webhook_secret:
        # en dev tu peux laisser vide => on n'applique pas la vérif
        return True

    sig = signature.strip()
    if sig.startswith("sha256="):
        sig = sig.split("=", 1)[1].strip()

    expected = hmac.new(cfg.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return constant_time_compare(expected, sig)
