"""Authentication endpoints: Telegram, Google, Apple — all return a JWT."""
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..core.security import create_access_token, get_current_user
from ..db import get_session
from ..models.user import User
from ..schemas.common import TokenOut, UserOut
from ..services.auth.apple import verify_apple_id_token
from ..services.auth.google import verify_google_id_token
from ..services.auth.telegram import verify_telegram_login
from ..services.provisioning import ensure_user

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class TelegramLoginIn(BaseModel):
    payload: dict[str, Any]
    ref_code: str | None = None


class GoogleLoginIn(BaseModel):
    id_token: str
    ref_code: str | None = None


class AppleLoginIn(BaseModel):
    id_token: str
    ref_code: str | None = None


@router.post("/telegram", response_model=TokenOut)
async def login_telegram(
    body: TelegramLoginIn,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    if not settings.enable_telegram_auth:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "telegram login is disabled")
    try:
        identity = verify_telegram_login(body.payload, settings.telegram_bot_token)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    user = await ensure_user(
        db,
        telegram_id=identity.id,
        handle_hint=identity.username,
        display_name=f"{identity.first_name} {identity.last_name}".strip() or identity.username or f"tg{identity.id}",
        avatar_url=identity.photo_url,
        ref_code=body.ref_code,
    )
    await db.commit()
    return TokenOut(access_token=create_access_token(user.id))


@router.post("/google", response_model=TokenOut)
async def login_google(
    body: GoogleLoginIn,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    if not settings.enable_google_auth:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "google login is temporarily disabled")
    try:
        identity = await verify_google_id_token(body.id_token, settings.google_client_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    user = await ensure_user(
        db,
        google_sub=identity.sub,
        handle_hint=(identity.email.split("@")[0] if identity.email else identity.name) or f"gg{identity.sub[-6:]}",
        display_name=identity.name,
        email=identity.email or None,
        avatar_url=identity.picture,
        ref_code=body.ref_code,
    )
    await db.commit()
    return TokenOut(access_token=create_access_token(user.id))


@router.post("/apple", response_model=TokenOut)
async def login_apple(
    body: AppleLoginIn,
    db: Annotated[AsyncSession, Depends(get_session)],
):
    if not settings.enable_apple_auth:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "apple login is temporarily disabled")
    try:
        identity = await verify_apple_id_token(body.id_token, settings.apple_client_id)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    user = await ensure_user(
        db,
        apple_sub=identity.sub,
        handle_hint=(identity.email.split("@")[0] if identity.email else f"apl{identity.sub[-6:]}"),
        email=identity.email or None,
        ref_code=body.ref_code,
    )
    await db.commit()
    return TokenOut(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
async def me(user: Annotated[User, Depends(get_current_user)]):
    return user


class PublicConfigOut(BaseModel):
    telegram_bot_username: str
    google_client_id: str
    apple_client_id: str
    enable_telegram_auth: bool
    enable_google_auth: bool
    enable_apple_auth: bool


@router.get("/config", response_model=PublicConfigOut)
async def public_config():
    return PublicConfigOut(
        telegram_bot_username=settings.telegram_bot_username if settings.enable_telegram_auth else "",
        google_client_id=settings.google_client_id if settings.enable_google_auth else "",
        apple_client_id=settings.apple_client_id if settings.enable_apple_auth else "",
        enable_telegram_auth=settings.enable_telegram_auth,
        enable_google_auth=settings.enable_google_auth,
        enable_apple_auth=settings.enable_apple_auth,
    )
