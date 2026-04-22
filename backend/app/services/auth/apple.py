"""Verify a Sign-In-with-Apple id_token.

Apple's JWKS: https://appleid.apple.com/auth/keys
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import httpx
from jose import jwt
from jose.exceptions import JWTError

APPLE_CERTS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"

_jwks_cache: dict = {"ts": 0, "keys": None}


@dataclass
class AppleIdentity:
    sub: str
    email: str


async def _jwks() -> dict:
    now = time.time()
    if _jwks_cache["keys"] and now - _jwks_cache["ts"] < 3600:
        return _jwks_cache["keys"]
    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.get(APPLE_CERTS_URL)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()
        _jwks_cache["ts"] = now
    return _jwks_cache["keys"]


async def verify_apple_id_token(id_token: str, audience: str) -> AppleIdentity:
    if not audience:
        raise ValueError("Apple client id is not configured")

    keys = await _jwks()
    try:
        header = jwt.get_unverified_header(id_token)
    except JWTError as e:
        raise ValueError(f"invalid JWT header: {e}") from e

    kid = header.get("kid")
    key = next((k for k in keys["keys"] if k.get("kid") == kid), None)
    if key is None:
        raise ValueError("unknown signing key")

    try:
        claims = jwt.decode(id_token, key, algorithms=[header.get("alg", "RS256")], audience=audience, issuer=APPLE_ISSUER)
    except JWTError as e:
        raise ValueError(f"token verification failed: {e}") from e

    return AppleIdentity(
        sub=str(claims["sub"]),
        email=str(claims.get("email", "")),
    )
