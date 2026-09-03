import { expect, test } from "@playwright/test";
import path from "node:path";

test.describe("/api/analytics — event ingestion", () => {
  test("accepts a valid page_view", async ({ request }) => {
    const response = await request.post("/api/analytics", { data: { name: "page_view", path: "/" } });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("accepts a valid tool_view with a real tool slug", async ({ request }) => {
    const response = await request.post("/api/analytics", {
      data: { name: "tool_view", tool: "merge-pdf", path: "/tools/merge-pdf" },
    });
    expect(response.status()).toBe(200);
  });

  test("rejects a server-only lifecycle event from the public endpoint", async ({ request }) => {
    const response = await request.post("/api/analytics", {
      data: { name: "processing_completed", tool: "merge-pdf" },
    });
    expect(response.status()).toBe(400);
  });

  test("rejects an unknown tool slug", async ({ request }) => {
    const response = await request.post("/api/analytics", {
      data: { name: "tool_view", tool: "not-a-real-tool" },
    });
    expect(response.status()).toBe(400);
  });

  test("rejects a malformed body", async ({ request }) => {
    const response = await request.post("/api/analytics", { data: { nonsense: true } });
    expect(response.status()).toBe(400);
  });
});

test.describe("analytics events fire from real page interactions", () => {
  test("visiting a tool page reports page_view and tool_view", async ({ page }) => {
    const events: unknown[] = [];
    await page.route("**/api/analytics", async (route) => {
      events.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await page.goto("/tools/merge-pdf");
    await expect.poll(() => events.length).toBeGreaterThanOrEqual(2);

    expect(events).toContainEqual({ name: "page_view", path: "/tools/merge-pdf" });
    expect(events).toContainEqual({ name: "tool_view", tool: "merge-pdf", path: "/tools/merge-pdf" });
  });

  test("visiting a German tool page reports page_view and tool_view under the real tool slug, distinguished by the German path", async ({
    page,
  }) => {
    const events: unknown[] = [];
    await page.route("**/api/analytics", async (route) => {
      events.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await page.goto("/de/tools/pdf-komprimieren");
    await expect.poll(() => events.length).toBeGreaterThanOrEqual(2);

    expect(events).toContainEqual({ name: "page_view", path: "/de/tools/pdf-komprimieren" });
    // `tool` stays the same real registry slug English uses ("compress-pdf",
    // not a separate German identifier); `path` is what actually
    // distinguishes this as a German view.
    expect(events).toContainEqual({ name: "tool_view", tool: "compress-pdf", path: "/de/tools/pdf-komprimieren" });

    // Exactly one tool_view, not two: proves the German route match doesn't
    // also fall through to firing a second, English-pattern tool_view.
    const toolViews = (events as { name: string }[]).filter((e) => e.name === "tool_view");
    expect(toolViews).toHaveLength(1);
  });

  test("adding a valid file reports file_upload with the tool name, never a filename", async ({ page }) => {
    const events: Record<string, unknown>[] = [];
    await page.route("**/api/analytics", async (route) => {
      events.push(JSON.parse(route.request().postData() ?? "{}"));
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await page.goto("/tools/merge-pdf");
    await page
      .locator('input[type="file"]')
      .setInputFiles(path.join(__dirname, "fixtures", "merge-a.pdf"));

    await expect.poll(() => events.some((e) => e.name === "file_upload")).toBe(true);

    const uploadEvent = events.find((e) => e.name === "file_upload")!;
    expect(uploadEvent).toEqual({ name: "file_upload", tool: "merge-pdf" });
    expect(JSON.stringify(uploadEvent)).not.toContain("merge-a.pdf");
  });
});
