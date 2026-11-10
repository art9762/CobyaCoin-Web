import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../stores/session";
import { Glass } from "./Glass";
import { Btn } from "./Btn";
import { getToken } from "../api/client";

export function Protected({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading, error, refresh, logout } = useSession();
  const loc = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", zIndex: 1 }}>
        <Glass style={{ padding: 28 }}>Загрузка сессии…</Glass>
      </div>
    );
  }
  if (!user && error && getToken()) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, position: "relative", zIndex: 1 }}>
        <Glass style={{ padding: 28, maxWidth: 460 }}>
          <h1 style={{ fontSize: 22 }}>Не удалось восстановить сессию</h1>
          <p role="alert">{error}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn onClick={() => { void refresh(); }}>Повторить</Btn>
            <Btn tone="glass" onClick={logout}>Войти заново</Btn>
          </div>
        </Glass>
      </div>
    );
  }
  if (!user) {
    const from = loc.pathname + loc.search + loc.hash;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }
  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}
