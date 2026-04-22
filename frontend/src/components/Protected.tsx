import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../stores/session";
import { Glass } from "./Glass";

export function Protected({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading, refresh } = useSession();
  const loc = useLocation();

  useEffect(() => {
    if (!user && !loading && localStorage.getItem("cobya:token")) {
      void refresh();
    }
  }, [user, loading, refresh]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", zIndex: 1 }}>
        <Glass style={{ padding: 28 }}>Загрузка сессии…</Glass>
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(loc.pathname)}`} replace />;
  }
  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}
