import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { publicConfig, loginApple, loginGoogle, loginTelegram } from "../api/endpoints";
import type { PublicConfig } from "../types";
import { useSession } from "../stores/session";
import { useToasts } from "../stores/toast";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { CoinMark } from "../components/Marks";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void;
        signIn: () => Promise<{ authorization: { id_token: string } }>;
      };
    };
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useSession((s) => s.setSession);
  const show = useToasts((s) => s.show);

  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const refCode = params.get("ref") ?? undefined;
  const tgContainerRef = useRef<HTMLDivElement>(null);
  const googleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publicConfig().then(setConfig).catch(() => setConfig({
      telegram_bot_username: "", google_client_id: "", apple_client_id: "",
      enable_telegram_auth: false, enable_google_auth: false, enable_apple_auth: false,
    }));
  }, []);

  // ===== Telegram Login Widget =====
  useEffect(() => {
    if (!config?.enable_telegram_auth || !config.telegram_bot_username || !tgContainerRef.current) return;
    window.onTelegramAuth = async (user: Record<string, unknown>) => {
      setBusy(true);
      try {
        const resp = await loginTelegram(user, refCode);
        await setSession(resp.access_token);
        show({ emoji: "🤖", text: "Вход через Telegram выполнен." });
        navigate("/home", { replace: true });
      } catch (e) {
        show({ emoji: "❌", text: e instanceof Error ? e.message : "Telegram login failed" });
      } finally {
        setBusy(false);
      }
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.setAttribute("data-telegram-login", config.telegram_bot_username);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-radius", "12");
    s.setAttribute("data-userpic", "true");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-onauth", "onTelegramAuth(user)");
    s.async = true;
    tgContainerRef.current.innerHTML = "";
    tgContainerRef.current.appendChild(s);
  }, [config?.telegram_bot_username, navigate, setSession, show, refCode]);

  // ===== Google =====
  useEffect(() => {
    if (!config?.enable_google_auth || !config.google_client_id || !googleContainerRef.current) return;

    const init = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: config.google_client_id,
        callback: async (resp) => {
          setBusy(true);
          try {
            const r = await loginGoogle(resp.credential, refCode);
            await setSession(r.access_token);
            show({ emoji: "🤖", text: "Вход через Google выполнен." });
            navigate("/home", { replace: true });
          } catch (e) {
            show({ emoji: "❌", text: e instanceof Error ? e.message : "Google login failed" });
          } finally {
            setBusy(false);
          }
        },
      });
      if (googleContainerRef.current) {
        googleContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleContainerRef.current, {
          theme: "filled_black", size: "large", shape: "pill", text: "continue_with",
        });
      }
    };
    if (window.google) { init(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [config?.google_client_id, navigate, setSession, show, refCode]);

  // ===== Apple =====
  const appleReady = useMemo(
    () => Boolean(config?.enable_apple_auth && config?.apple_client_id),
    [config],
  );
  const onAppleClick = async () => {
    if (!config?.apple_client_id) return;
    const ensureSdk = () => new Promise<void>((resolve) => {
      if (window.AppleID) return resolve();
      const s = document.createElement("script");
      s.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      s.async = true;
      s.onload = () => resolve();
      document.head.appendChild(s);
    });
    await ensureSdk();
    window.AppleID!.auth.init({
      clientId: config.apple_client_id,
      scope: "email",
      redirectURI: window.location.origin + "/login",
      usePopup: true,
    });
    try {
      setBusy(true);
      const r = await window.AppleID!.auth.signIn();
      const token = r.authorization.id_token;
      const session = await loginApple(token, refCode);
      await setSession(session.access_token);
      show({ emoji: "🍎", text: "Вход через Apple выполнен." });
      navigate("/home", { replace: true });
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "Apple login failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "grid", placeItems: "center",
      padding: "40px 16px", position: "relative", zIndex: 1,
    }}>
      <Glass tier="thick" style={{
        width: "100%", maxWidth: 460, padding: 36, borderRadius: 32,
        display: "flex", flexDirection: "column", gap: 22,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CoinMark size={48} spin />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>CobyaCoin</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase",
              letterSpacing: ".1em", fontWeight: 700 }}>Pseudo exchange</div>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: 30, lineHeight: "34px", fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>
            Войди и начни торговать
          </h1>
          <p style={{ color: "var(--fg-2)", marginTop: 8, marginBottom: 0 }}>
            Твоя ферма, кошелёк и ставки хранятся на сервере — продолжай с любого устройства.
          </p>
        </div>

        {refCode && (
          <Chip tint="success">Реферальный код: {refCode} — +10 000 MPL при регистрации</Chip>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Telegram */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase",
              letterSpacing: ".08em", fontWeight: 700 }}>Telegram</div>
            {config?.enable_telegram_auth && config.telegram_bot_username ? (
              <div ref={tgContainerRef} />
            ) : config?.enable_telegram_auth ? (
              <Btn tone="glass" disabled>Telegram-бот не настроен</Btn>
            ) : (
              <Btn tone="glass" disabled>Telegram-вход временно отключён</Btn>
            )}
          </div>

          {/* Google */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase",
              letterSpacing: ".08em", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
              <span>Google</span>
              {!config?.enable_google_auth && <Chip tint="neutral">скоро</Chip>}
            </div>
            {config?.enable_google_auth && config.google_client_id ? (
              <div ref={googleContainerRef} />
            ) : (
              <Btn tone="glass" disabled> Войти через Google — скоро</Btn>
            )}
          </div>

          {/* Apple */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, color: "var(--fg-3)", textTransform: "uppercase",
              letterSpacing: ".08em", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
              <span>Apple</span>
              {!config?.enable_apple_auth && <Chip tint="neutral">скоро</Chip>}
            </div>
            {appleReady ? (
              <Btn tone="glass" onClick={onAppleClick} disabled={busy}>
                 Войти через Apple
              </Btn>
            ) : (
              <Btn tone="glass" disabled> Войти через Apple — скоро</Btn>
            )}
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--fg-4)", textAlign: "center", lineHeight: 1.6 }}>
          Нажимая «Войти», ты соглашаешься с правилами сервиса и политикой обработки
          данных. CobyaCoin — обучающая симуляция, MPL и CBC не являются реальной валютой.
        </div>
      </Glass>
    </div>
  );
}
