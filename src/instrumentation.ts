export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCleanupScheduler } = await import("@/lib/files/cleanup");
    startCleanupScheduler();
  }
}
