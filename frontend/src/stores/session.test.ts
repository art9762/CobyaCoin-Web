import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getToken, setToken } from "../api/client";
import { me } from "../api/endpoints";
import { deferred, user } from "../test/fixtures";
import type { User } from "../types";
import { useSession } from "./session";

vi.mock("../api/endpoints", () => ({ me: vi.fn() }));

beforeEach(() => {
  useSession.getState().logout();
  vi.mocked(me).mockReset();
});

describe("session lifecycle", () => {
  it("settles anonymous startup without requesting a user", async () => {
    expect(await useSession.getState().refresh()).toBe(false);
    expect(me).not.toHaveBeenCalled();
    expect(useSession.getState()).toMatchObject({ user: null, loading: false, error: null });
  });

  it("shares concurrent restore requests, including StrictMode bootstrap", async () => {
    setToken("synthetic-token");
    const response = deferred<User>();
    vi.mocked(me).mockReturnValue(response.promise);
    const first = useSession.getState().refresh();
    const second = useSession.getState().refresh();
    expect(first).toBe(second);
    expect(me).toHaveBeenCalledTimes(1);
    response.resolve(user);
    expect(await first).toBe(true);
    expect(useSession.getState()).toMatchObject({ user, loading: false, error: null });
  });

  it.each(["resolve", "reject"] as const)("ignores a pending %s after logout", async (completion) => {
    setToken("synthetic-token");
    const response = deferred<User>();
    vi.mocked(me).mockReturnValue(response.promise);
    const pending = useSession.getState().refresh();
    useSession.getState().logout();
    if (completion === "resolve") response.resolve(user);
    else response.reject(new Error("old error"));
    expect(await pending).toBe(false);
    expect(getToken()).toBeNull();
    expect(useSession.getState()).toMatchObject({ user: null, loading: false, error: null });
  });

  it("does not replace a newer login with an older restore result", async () => {
    setToken("old-token");
    const old = deferred<User>();
    vi.mocked(me).mockReturnValueOnce(old.promise);
    const pending = useSession.getState().refresh();
    const replacement = { ...user, id: -2, handle: "@replacement" };
    vi.mocked(me).mockResolvedValueOnce(replacement);
    await useSession.getState().setSession("new-token");
    old.resolve(user);
    expect(await pending).toBe(false);
    expect(getToken()).toBe("new-token");
    expect(useSession.getState().user).toEqual(replacement);
  });

  it("keeps transient restore failures retryable without an automatic loop", async () => {
    setToken("synthetic-token");
    vi.mocked(me).mockRejectedValueOnce(new ApiError(503, "Temporarily unavailable"));
    expect(await useSession.getState().refresh()).toBe(false);
    expect(getToken()).toBe("synthetic-token");
    expect(useSession.getState()).toMatchObject({ user: null, loading: false, error: "Temporarily unavailable" });
    expect(me).toHaveBeenCalledTimes(1);
    vi.mocked(me).mockResolvedValueOnce(user);
    expect(await useSession.getState().refresh()).toBe(true);
    expect(useSession.getState().user).toEqual(user);
  });

  it("clears an invalid token even without an App subscriber", async () => {
    setToken("expired-token");
    vi.mocked(me).mockRejectedValueOnce(new ApiError(401, "invalid token"));
    expect(await useSession.getState().refresh()).toBe(false);
    expect(getToken()).toBeNull();
    expect(useSession.getState()).toMatchObject({ user: null, loading: false, error: null });
  });

  it("rejects a login whose user validation fails", async () => {
    vi.mocked(me).mockRejectedValueOnce(new ApiError(503, "Cannot validate login"));
    await expect(useSession.getState().setSession("synthetic-token")).rejects.toThrow("Cannot validate login");
    expect(useSession.getState().user).toBeNull();
  });

  it("rejects a login that was interrupted by logout", async () => {
    const response = deferred<User>();
    vi.mocked(me).mockReturnValueOnce(response.promise);
    const login = useSession.getState().setSession("synthetic-token");
    useSession.getState().logout();
    response.resolve(user);
    await expect(login).rejects.toThrow("Не удалось подтвердить сессию");
    expect(useSession.getState().user).toBeNull();
  });
});
