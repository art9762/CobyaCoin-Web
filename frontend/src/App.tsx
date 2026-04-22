import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./stores/session";
import { AppLayout } from "./components/Layout";
import { Protected } from "./components/Protected";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExchangePage } from "./pages/ExchangePage";
import { MiningPage } from "./pages/MiningPage";
import { AuctionPage } from "./pages/AuctionPage";
import { CasinoPage } from "./pages/CasinoPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  const refresh = useSession((s) => s.refresh);
  const setLoading = useSession.setState;

  useEffect(() => {
    if (localStorage.getItem("cobya:token")) {
      void refresh();
    } else {
      setLoading({ loading: false });
    }
  }, [refresh, setLoading]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<DashboardPage />} />
        <Route path="/trade" element={<ExchangePage />} />
        <Route path="/mining" element={<MiningPage />} />
        <Route path="/auction" element={<AuctionPage />} />
        <Route path="/casino" element={<CasinoPage />} />
        <Route path="/ranks" element={<LeaderboardPage />} />
        <Route path="/me" element={<ProfilePage />} />
        <Route path="/admin" element={<Protected requireAdmin><AdminPage /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
