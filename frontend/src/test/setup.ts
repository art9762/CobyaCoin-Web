import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, vi } from "vitest";

let unexpectedRequests: string[] = [];

beforeEach(() => {
  // Unexpected requests fail the test; no backend, provider or transaction is contacted.
  unexpectedRequests = [];
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
    unexpectedRequests.push(String(input));
    return Promise.reject(new Error("Unexpected network request"));
  }));
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  expect(unexpectedRequests).toEqual([]);
});
