export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCleanupScheduler } = await import("@/lib/files/cleanup");
    startCleanupScheduler();

    const { startRateLimitCleanupScheduler } = await import("@/lib/security/rateLimit");
    startRateLimitCleanupScheduler();
  }
}
