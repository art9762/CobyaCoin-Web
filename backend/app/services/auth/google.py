"""Verify a Google OAuth id_token.

We fetch Google's JWKS and validate the JWT ourselves via python-jose.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import httpx
from jose import jwt
from jose.exceptions import JWTError

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = {"https://accounts.google.com", "accounts.google.com"}

_jwks_cache: dict = {"ts": 0, "keys": None}


@dataclass
class GoogleIdentity:
    sub: str
    email: str
    name: str
    picture: str


async def _jwks() -> dict:
    now = time.time()
    if _jwks_cache["keys"] and now - _jwks_cache["ts"] < 3600:
        return _jwks_cache["keys"]
    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.get(GOOGLE_CERTS_URL)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()
        _jwks_cache["ts"] = now
    return _jwks_cache["keys"]


async def verify_google_id_token(id_token: str, audience: str) -> GoogleIdentity:
    if not audience:
        raise ValueError("Google client id is not configured")

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
        claims = jwt.decode(id_token, key, algorithms=[header.get("alg", "RS256")], audience=audience)
    except JWTError as e:
        raise ValueError(f"token verification failed: {e}") from e

    if claims.get("iss") not in GOOGLE_ISSUERS:
        raise ValueError("unexpected issuer")

    return GoogleIdentity(
        sub=str(claims["sub"]),
        email=str(claims.get("email", "")),
        name=str(claims.get("name", "")),
        picture=str(claims.get("picture", "")),
    )
