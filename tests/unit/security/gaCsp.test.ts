import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

async function loadCsp(): Promise<string> {
  // The module evaluates GA_ENABLED once, at import time — vi.resetModules()
  // forces a fresh evaluation so each test's process.env change actually
  // takes effect, rather than reusing the previous test's cached module.
  vi.resetModules();
  const { default: nextConfig } = await import("../../../next.config");
  const rules = await nextConfig.headers!();
  const csp = rules[0].headers.find((h) => h.key === "Content-Security-Policy");
  if (!csp) throw new Error("no Content-Security-Policy header configured");
  return csp.value;
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = ORIGINAL;
});

describe("Content-Security-Policy — GA4 origins", () => {
  it("does not allow any Google Analytics origin when no Measurement ID is configured", async () => {
    const csp = await loadCsp();
    expect(csp).not.toContain("googletagmanager.com");
    expect(csp).not.toContain("google-analytics.com");
  });

  it("allows GA4's script and connect origins once a Measurement ID is configured", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TESTID123";
    const csp = await loadCsp();

    const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
    expect(scriptSrc).toContain("https://www.googletagmanager.com");

    const connectSrc = csp.split(";").find((d) => d.trim().startsWith("connect-src")) ?? "";
    expect(connectSrc).toContain("https://www.google-analytics.com");
    expect(connectSrc).toContain("https://www.googletagmanager.com");

    // Still no wildcard/unsafe-eval regression from this change.
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("script-src *");
  });
});
