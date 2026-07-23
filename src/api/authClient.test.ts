import { describe, expect, it } from "vitest";
import {
  defaultAuthApiBaseUrl,
  getAuthApiBaseUrl,
  isAuthApiConfigured,
  resolveAuthApiBaseUrl,
} from "./authClient";

describe("account API configuration", () => {
  it("uses the public Typely account server when no build variable is supplied", () => {
    expect(resolveAuthApiBaseUrl()).toBe(defaultAuthApiBaseUrl);
    expect(resolveAuthApiBaseUrl("   ")).toBe(defaultAuthApiBaseUrl);
  });

  it("allows a deployment to override the account server", () => {
    expect(resolveAuthApiBaseUrl("https://example.com/api///")).toBe("https://example.com/api");
  });

  it("always produces a configured API URL for official builds", () => {
    expect(isAuthApiConfigured()).toBe(true);
    expect(getAuthApiBaseUrl()).toMatch(/^https:\/\//u);
  });
});
