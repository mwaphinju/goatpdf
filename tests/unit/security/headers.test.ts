import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

async function getConfiguredHeaders() {
  if (typeof nextConfig.headers !== "function") {
    throw new Error("next.config.ts no longer defines a headers() function");
  }
  const rules = await nextConfig.headers();
  expect(rules.length).toBeGreaterThan(0);
  return rules[0].headers;
}

describe("security headers configured in next.config.ts", () => {
  it("applies the header rule to every route", async () => {
    const rules = await nextConfig.headers!();
    expect(rules[0].source).toBe("/:path*");
  });

  it("sets a Content-Security-Policy that blocks framing and restricts default sources", async () => {
    const headers = await getConfiguredHeaders();
    const csp = headers.find((h) => h.key === "Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp!.value).toContain("default-src 'self'");
    expect(csp!.value).toContain("frame-ancestors 'none'");
    expect(csp!.value).toContain("object-src 'none'");
    // No wildcard/unsafe script sources — this is the header most worth
    // guarding against silent regression (e.g. someone adding 'unsafe-eval'
    // to work around a bundler issue).
    expect(csp!.value).not.toContain("unsafe-eval");
    expect(csp!.value).not.toContain("script-src *");
  });

  it("sets X-Content-Type-Options: nosniff", async () => {
    const headers = await getConfiguredHeaders();
    expect(headers.find((h) => h.key === "X-Content-Type-Options")?.value).toBe("nosniff");
  });

  it("sets X-Frame-Options: DENY", async () => {
    const headers = await getConfiguredHeaders();
    expect(headers.find((h) => h.key === "X-Frame-Options")?.value).toBe("DENY");
  });

  it("sets a restrictive Referrer-Policy", async () => {
    const headers = await getConfiguredHeaders();
    expect(headers.find((h) => h.key === "Referrer-Policy")?.value).toBe("strict-origin-when-cross-origin");
  });

  it("sets a Permissions-Policy that denies camera/microphone/geolocation", async () => {
    const headers = await getConfiguredHeaders();
    const policy = headers.find((h) => h.key === "Permissions-Policy")?.value ?? "";
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  });
});
