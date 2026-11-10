import { StrictMode, useEffect } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { api, getToken, setToken } from "./api/client";
import { loginTelegram, me, publicConfig } from "./api/endpoints";
import { useSession } from "./stores/session";
import { useToasts } from "./stores/toast";
import { config, user } from "./test/fixtures";

const { layoutCleanup } = vi.hoisted(() => ({ layoutCleanup: vi.fn() }));

// Keep routing, login UI, session store, API client and toasts real. Economic pages
// and their polling/streaming effects are replaced with inert components.
vi.mock("./components/Layout", () => ({
  AppLayout: () => {
    useEffect(() => () => layoutCleanup(), []);
    return <Outlet />;
  },
}));
vi.mock("./pages/DashboardPage", () => ({ DashboardPage: () => <div>Dashboard fixture</div> }));
vi.mock("./pages/ExchangePage", () => ({ ExchangePage: () => <div>Exchange fixture</div> }));
vi.mock("./pages/MiningPage", () => ({ MiningPage: () => <div>Mining fixture</div> }));
vi.mock("./pages/AuctionPage", () => ({ AuctionPage: () => <div>Auction fixture</div> }));
vi.mock("./pages/CasinoPage", () => ({ CasinoPage: () => <div>Casino fixture</div> }));
vi.mock("./pages/LeaderboardPage", () => ({ LeaderboardPage: () => <div>Ranks fixture</div> }));
vi.mock("./pages/ProfilePage", () => ({ ProfilePage: () => <div>Profile fixture</div> }));
vi.mock("./pages/AdminPage", () => ({ AdminPage: () => <div>Admin fixture</div> }));
vi.mock("./api/endpoints", () => ({
  me: vi.fn(), publicConfig: vi.fn(), loginTelegram: vi.fn(), loginGoogle: vi.fn(), loginApple: vi.fn(),
}));

function Location() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search + location.hash}</span>;
}

function renderApp(path: string, strict = false) {
  const content = <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /><Location /></MemoryRouter>;
  return render(strict ? <StrictMode>{content}</StrictMode> : content);
}

async function telegramCallback() {
  await waitFor(() => expect(window.onTelegramAuth).toBeTypeOf("function"));
  await act(async () => { await window.onTelegramAuth?.({ id: -1, first_name: "Synthetic" }); });
}

beforeEach(() => {
  useSession.getState().logout();
  useSession.setState({ loading: true });
  useToasts.setState({ toasts: [] });
  vi.mocked(publicConfig).mockReset().mockResolvedValue(config);
  vi.mocked(me).mockReset();
  vi.mocked(loginTelegram).mockReset().mockResolvedValue({ access_token: "synthetic-token" });
  layoutCleanup.mockClear();
});

describe("authentication recovery routes", () => {
  it("returns to the full requested route after mocked provider login", async () => {
    renderApp("/trade?view=open#orders");
    await screen.findByText("Войди и начни торговать");
    expect(screen.getByTestId("location").textContent).toBe("/login?from=%2Ftrade%3Fview%3Dopen%23orders");
    vi.mocked(me).mockResolvedValue(user);
    await telegramCallback();
    await screen.findByText("Exchange fixture");
    expect(screen.getByTestId("location").textContent).toBe("/trade?view=open#orders");
    expect(loginTelegram).toHaveBeenCalledWith({ id: -1, first_name: "Synthetic" }, undefined);
  });

  it("shows failed session validation on the login page without claiming success", async () => {
    renderApp("/login?from=%2Ftrade");
    vi.mocked(me).mockRejectedValue(new Error("Validation fixture unavailable"));
    await telegramCallback();
    expect(await screen.findByText("Validation fixture unavailable")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Validation fixture unavailable");
    expect(screen.queryByText("Вход через Telegram выполнен.")).toBeNull();
    expect(screen.getByTestId("location").textContent).toBe("/login?from=%2Ftrade");
    expect(useSession.getState().user).toBeNull();
  });

  it("rests on a retry screen after a transient failure instead of looping requests", async () => {
    setToken("saved-token");
    vi.mocked(me).mockRejectedValueOnce(new Error("Restore fixture unavailable"));
    renderApp("/trade");
    await screen.findByRole("alert");
    expect(me).toHaveBeenCalledTimes(1);
    expect(getToken()).toBe("saved-token");
    expect(screen.getByTestId("location").textContent).toBe("/trade");
    vi.mocked(me).mockResolvedValueOnce(user);
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    await screen.findByText("Exchange fixture");
    expect(me).toHaveBeenCalledTimes(2);
  });

  it("lets the user discard a failed restore and sign in again", async () => {
    setToken("saved-token");
    vi.mocked(me).mockRejectedValueOnce(new Error("Restore fixture unavailable"));
    renderApp("/mining");
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Войти заново" }));
    await screen.findByText("Войди и начни торговать");
    expect(getToken()).toBeNull();
    expect(screen.getByTestId("location").textContent).toBe("/login?from=%2Fmining");
  });

  it("restores an existing session on the login page and honors its destination", async () => {
    setToken("saved-token");
    vi.mocked(me).mockResolvedValueOnce(user);
    renderApp("/login?from=%2Fmining");
    await screen.findByText("Mining fixture");
    expect(screen.getByTestId("location").textContent).toBe("/mining");
    expect(loginTelegram).not.toHaveBeenCalled();
  });

  it("shares bootstrap work across StrictMode effects", async () => {
    setToken("saved-token");
    vi.mocked(me).mockResolvedValue(user);
    renderApp("/home", true);
    await screen.findByText("Dashboard fixture");
    expect(me).toHaveBeenCalledTimes(1);
  });

  it("unmounts the authenticated layout immediately when an API request expires", async () => {
    setToken("saved-token");
    vi.mocked(me).mockResolvedValueOnce(user);
    renderApp("/trade?view=open#orders");
    await screen.findByText("Exchange fixture");
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"detail":"expired"}', { status: 401 }));
    await act(async () => { await expect(api("/wallet")).rejects.toMatchObject({ status: 401 }); });
    await screen.findByText("Войди и начни торговать");
    expect(screen.queryByText("Exchange fixture")).toBeNull();
    expect(layoutCleanup).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
    expect(useSession.getState().user).toBeNull();
    expect(screen.getByTestId("location").textContent).toBe("/login?from=%2Ftrade%3Fview%3Dopen%23orders");
  });

  it("keeps the admin route protected for ordinary restored users", async () => {
    setToken("saved-token");
    vi.mocked(me).mockResolvedValueOnce(user);
    renderApp("/admin");
    await screen.findByText("Dashboard fixture");
    expect(screen.queryByText("Admin fixture")).toBeNull();
  });
});
