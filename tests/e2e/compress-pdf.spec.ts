import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const TEXT_FILE = path.join(FIXTURES_DIR, "compress-text.pdf");
const IMAGE_HEAVY_FILE = path.join(FIXTURES_DIR, "compress-image-heavy.pdf");
const SCANNED_FILE = path.join(FIXTURES_DIR, "compress-scanned.pdf");
const SMALL_FILE = path.join(FIXTURES_DIR, "compress-small.pdf");
const LARGE_FILE = path.join(FIXTURES_DIR, "compress-large.pdf");
const ALREADY_COMPRESSED_FILE = path.join(FIXTURES_DIR, "compress-already-compressed.pdf");
const CORRUPTED_FILE = path.join(FIXTURES_DIR, "compress-corrupted.pdf");

test.describe("Compress PDF", () => {
  test("starts with an empty state and a disabled action button", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await expect(page.getByRole("heading", { level: 1, name: "Compress PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compress PDF" })).toBeDisabled();
  });

  test("shows all three presets after uploading, defaulting to Recommended", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles(TEXT_FILE);

    await expect(page.getByRole("radio", { name: /^Recommended/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: /^High Quality/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /^Maximum Compression/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compress PDF" })).toBeEnabled();
  });

  test("compressing an image-heavy PDF shows real measured stats and a genuinely smaller download", async ({
    page,
  }) => {
    await page.goto("/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles(IMAGE_HEAVY_FILE);
    await page.getByRole("radio", { name: /^Maximum Compression/ }).check();

    await page.route("**/api/compress-pdf", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByRole("button", { name: "Compress PDF" }).click();
    await expect(page.getByText("Compressing your PDF")).toBeVisible();

    await expect(page.getByText("Original size")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Compressed size")).toBeVisible();
    await expect(page.getByText("Space saved")).toBeVisible();
    await expect(page.getByText("Reduction")).toBeVisible();

    const originalStats = await fs.stat(IMAGE_HEAVY_FILE);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("compressed.pdf");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const downloadedStats = await fs.stat(downloadPath);

    // Never larger than the original, and — for a noisy image-heavy PDF at
    // Maximum Compression — meaningfully smaller, not just a rounding difference.
    expect(downloadedStats.size).toBeLessThan(originalStats.size);
    expect(downloadedStats.size).toBeLessThan(originalStats.size * 0.85);

    const doc = await PDFDocument.load(await fs.readFile(downloadPath));
    expect(doc.getPageCount()).toBe(1); // still a valid, loadable PDF
  });

  test("compressing a scanned-style PDF also reduces size", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles(SCANNED_FILE);

    await page.getByRole("button", { name: "Compress PDF" }).click();
    await expect(page.getByText("Reduction")).toBeVisible({ timeout: 30_000 });

    const reductionText = await page.locator("dd.text-emerald-700").textContent();
    expect(reductionText).toMatch(/^\d+%$/);
  });

  test("handles a small, text-only PDF gracefully without overstating the result", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles(SMALL_FILE);

    await page.getByRole("button", { name: "Compress PDF" }).click();
    await expect(page.getByText("Reduction")).toBeVisible({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");

    const originalStats = await fs.stat(SMALL_FILE);
    const downloadedStats = await fs.stat(downloadPath);
    // The tool must never hand back something larger than what was uploaded.
    expect(downloadedStats.size).toBeLessThanOrEqual(originalStats.size);
  });

  test("handles a larger, many-page PDF within a reasonable time", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles(LARGE_FILE);

    await page.getByRole("button", { name: "Compress PDF" }).click();
    await expect(page.getByText("Reduction")).toBeVisible({ timeout: 45_000 });
  });

  test("gracefully reports little or no further reduction on an already-compressed PDF, never growing it", async ({
    page,
  }) => {
    await page.goto("/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles(ALREADY_COMPRESSED_FILE);
    await page.getByRole("radio", { name: /^Maximum Compression/ }).check();

    await page.getByRole("button", { name: "Compress PDF" }).click();
    await expect(page.getByText("Reduction")).toBeVisible({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");

    const originalStats = await fs.stat(ALREADY_COMPRESSED_FILE);
    const downloadedStats = await fs.stat(downloadPath);
    expect(downloadedStats.size).toBeLessThanOrEqual(originalStats.size);
  });

  test("shows a clear error for a corrupted PDF, and start-over resets", async ({ page }) => {
    await page.goto("/tools/compress-pdf");
    await page.locator('input[type="file"]').setInputFiles(CORRUPTED_FILE);

    await page.getByRole("button", { name: "Compress PDF" }).click();

    const errorAlert = page.getByRole("alert").filter({ hasText: "couldn't be read" });
    await expect(errorAlert).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(errorAlert).toBeHidden();
    await expect(page.getByRole("button", { name: "Compress PDF" })).toBeDisabled();
  });
});
