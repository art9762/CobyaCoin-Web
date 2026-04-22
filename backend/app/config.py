from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./cobya.db"
    jwt_secret: str = "dev-jwt-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_ttl_days: int = 30

    telegram_bot_token: str = ""
    telegram_bot_username: str = ""
    google_client_id: str = ""
    apple_client_id: str = ""

    # Feature flags. Apple and Google login are currently disabled while we
    # finish the verification flow for the OAuth apps. Flip to True after
    # filling in GOOGLE_CLIENT_ID / APPLE_CLIENT_ID.
    enable_telegram_auth: bool = True
    enable_google_auth: bool = False
    enable_apple_auth: bool = False

    admin_handles: str = "@societykolyan"
    cors_origins: str = "http://localhost:5173"

    seed_mpl: float = 50_000
    seed_cbc: float = 20
    promo_cobya26_mpl: float = 50_000

    @property
    def admin_handle_list(self) -> list[str]:
        return [h.strip().lower() for h in self.admin_handles.split(",") if h.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
