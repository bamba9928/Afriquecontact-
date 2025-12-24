from __future__ import annotations

import hmac
import hashlib
import os
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional
from urllib.parse import urlencode

from django.utils.crypto import constant_time_compare

# Configuration du logging pour tracer les erreurs de paiement
logger = logging.getLogger(__name__)

try:
    import requests
except ImportError:
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
    """
    Récupère la configuration depuis les variables d'environnement.
    """
    return BictorysConfig(
        mock=os.getenv("BICTORYS_MOCK", "true").lower() in ("1", "true", "yes"),
        base_url=os.getenv("BICTORYS_BASE_URL", "https://api.bictorys.com").rstrip("/"),
        api_key=os.getenv("BICTORYS_API_KEY", ""),
        webhook_secret=os.getenv("BICTORYS_WEBHOOK_SECRET", ""),
        # URLs de redirection après paiement vers le Frontend (React Native / Web)
        success_url=os.getenv("CHECKOUT_SUCCESS_URL", "https://afriquecontact.sn/payment/success"),
        cancel_url=os.getenv("CHECKOUT_CANCEL_URL", "https://afriquecontact.sn/payment/cancel"),
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
    Initialise une session de paiement avec Bictorys.
    """
    cfg = get_bictorys_config()

    # --- MODE TEST / MOCK ---
    if cfg.mock:
        logger.info(f"[BICTORYS MOCK] Création checkout pour ref: {reference}")
        params = urlencode({"ref": reference, "amount": amount, "status": "success"})
        return {
            "checkout_url": f"{cfg.success_url}?{params}",
            "provider_payload": {"mock": True, "reference": reference},
        }

    # --- MODE PRODUCTION ---
    if requests is None:
        raise RuntimeError("Le package 'requests' est manquant. Installez-le avec 'pip install requests'.")

    if not cfg.api_key:
        raise ValueError("BICTORYS_API_KEY est manquante dans les variables d'environnement.")

    # Endpoint officiel Bictorys pour les charges
    url = f"{cfg.base_url}/pay/v1/charges"

    payload = {
        "reference": reference,
        "amount": amount,
        "currency": currency,
        "customer": {"phone": customer_phone},
        "redirect_urls": {
            "success": cfg.success_url,
            "cancel": cfg.cancel_url
        },
        "metadata": metadata or {},
    }

    headers = {
        "Authorization": f"Bearer {cfg.api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()

        # Bictorys peut renvoyer 'checkout_url', 'payment_url' ou 'url'
        checkout_url = data.get("checkout_url") or data.get("payment_url") or data.get("url")

        if not checkout_url:
            logger.error(f"Réponse Bictorys sans URL : {data}")
            raise RuntimeError("URL de paiement non générée par Bictorys.")

        return {"checkout_url": checkout_url, "provider_payload": data}

    except requests.exceptions.RequestException as e:
        logger.error(f"Erreur API Bictorys: {str(e)}")
        raise RuntimeError(f"La passerelle de paiement Bictorys est indisponible : {e}")


def verify_bictorys_signature(raw_body: bytes, signature: str) -> bool:
    """
    Vérifie l'authenticité des notifications (Webhooks) envoyées par Bictorys.
    Empêche les tentatives de fraude sur l'activation des abonnements.
    """
    cfg = get_bictorys_config()

    # En mode Mock sans secret, on accepte tout (uniquement pour le développement local)
    if cfg.mock and not cfg.webhook_secret:
        return True

    if not signature or not cfg.webhook_secret:
        return False

    # Nettoyage de la signature (format sha256=...)
    sig_to_check = signature.strip()
    if sig_to_check.startswith("sha256="):
        sig_to_check = sig_to_check.split("=", 1)[1]

    # Calcul du HMAC SHA256
    expected_sig = hmac.new(
        cfg.webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()

    # Comparaison sécurisée contre les attaques temporelles
    return constant_time_compare(expected_sig, sig_to_check)