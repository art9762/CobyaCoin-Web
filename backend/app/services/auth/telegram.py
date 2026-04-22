"""Verify a Telegram Login Widget payload.

Protocol: https://core.telegram.org/widgets/login#checking-authorization
  data_check_string = "\n".join(f"{k}={v}" for k,v in sorted(data)) over all fields except `hash`
  secret_key        = SHA256(bot_token)
  calculated_hash   = HMAC_SHA256(secret_key, data_check_string)
  calculated_hash must equal the `hash` field.
"""
from __future__ import annotations

import hashlib
import hmac
import time
from dataclasses import dataclass


@dataclass
class TelegramIdentity:
    id: int
    first_name: str
    last_name: str
    username: str
    photo_url: str


def verify_telegram_login(payload: dict, bot_token: str, max_age_seconds: int = 86400) -> TelegramIdentity:
    if not bot_token:
        raise ValueError("Telegram bot token is not configured")
    if "hash" not in payload:
        raise ValueError("hash field missing")

    received_hash = payload["hash"]
    check_items = {k: v for k, v in payload.items() if k != "hash"}

    # Telegram widget sometimes sends non-string values; coerce all to str.
    data_check_string = "\n".join(f"{k}={check_items[k]}" for k in sorted(check_items.keys()))
    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()
    calculated = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calculated, received_hash):
        raise ValueError("signature mismatch")

    auth_date = int(check_items.get("auth_date", 0))
    if auth_date == 0 or time.time() - auth_date > max_age_seconds:
        raise ValueError("auth_date expired")

    return TelegramIdentity(
        id=int(check_items["id"]),
        first_name=str(check_items.get("first_name", "")),
        last_name=str(check_items.get("last_name", "")),
        username=str(check_items.get("username", "")),
        photo_url=str(check_items.get("photo_url", "")),
    )
