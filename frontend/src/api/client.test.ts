import { describe, expect, it, vi } from "vitest";
import { api, ApiError, getToken, onUnauthorized, setToken } from "./client";
import { deferred } from "../test/fixtures";

describe("expired request handling", () => {
  it("clears the active credential and notifies mounted consumers once", async () => {
    setToken("expired-token");
    vi.mocked(fetch).mockResolvedValue(new Response('{"detail":"expired"}', { status: 401 }));
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    try {
      await expect(api("/wallet")).rejects.toMatchObject({ status: 401, message: "expired" });
      expect(getToken()).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);
      await expect(api("/wallet")).rejects.toBeInstanceOf(ApiError);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(vi.mocked(fetch).mock.calls[0][1]?.headers).toMatchObject({ Authorization: "Bearer expired-token" });
    } finally { unsubscribe(); }
  });

  it("does not invalidate a replacement login when an old request returns 401", async () => {
    setToken("old-token");
    const response = deferred<Response>();
    vi.mocked(fetch).mockReturnValue(response.promise);
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    try {
      const request = api("/wallet");
      setToken("new-token");
      response.resolve(new Response("{}", { status: 401 }));
      await expect(request).rejects.toBeInstanceOf(ApiError);
      expect(getToken()).toBe("new-token");
      expect(listener).not.toHaveBeenCalled();
    } finally { unsubscribe(); }
  });

  it.each(["server", "network"])("does not treat %s failure as an expired session", async (failure) => {
    setToken("synthetic-token");
    if (failure === "server") vi.mocked(fetch).mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    else vi.mocked(fetch).mockRejectedValueOnce(new Error("Offline fixture"));
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);
    try {
      await expect(api("/wallet")).rejects.toBeInstanceOf(Error);
      expect(getToken()).toBe("synthetic-token");
      expect(listener).not.toHaveBeenCalled();
    } finally { unsubscribe(); }
  });

  it("unsubscribes consumers that unmount", async () => {
    setToken("expired-token");
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 401 }));
    const listener = vi.fn();
    onUnauthorized(listener)();
    await expect(api("/wallet")).rejects.toBeInstanceOf(ApiError);
    expect(listener).not.toHaveBeenCalled();
  });
});
