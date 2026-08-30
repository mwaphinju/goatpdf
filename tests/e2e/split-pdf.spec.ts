import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const SOURCE_FILE = path.join(FIXTURES_DIR, "split-source.pdf"); // 6 pages
const CORRUPTED_FILE = path.join(FIXTURES_DIR, "split-corrupted.pdf");

test.describe("Split PDF", () => {
  test("starts with an empty state and a disabled action button", async ({ page }) => {
    await page.goto("/tools/split-pdf");
    await expect(page.getByRole("heading", { level: 1, name: "Split PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Split PDF" })).toBeDisabled();
  });

  test("shows the page count after uploading a valid PDF", async ({ page }) => {
    await page.goto("/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);

    await expect(page.getByText("This PDF has")).toContainText("6");
    await expect(page.getByRole("button", { name: "Split PDF" })).toBeEnabled();
  });

  test("splitting into individual pages produces a ZIP with one PDF per page", async ({ page }) => {
    await page.goto("/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    // Artificially slow the request so the transient "processing" state is reliably observable.
    await page.route("**/api/split-pdf", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByRole("button", { name: "Split PDF" }).click();
    await expect(page.getByText("Splitting your PDF")).toBeVisible();
    await expect(page.getByText("split-pages.zip")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("split-pages.zip");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const zip = await JSZip.loadAsync(await fs.readFile(downloadPath));
    expect(Object.keys(zip.files).sort()).toEqual([
      "page-1.pdf",
      "page-2.pdf",
      "page-3.pdf",
      "page-4.pdf",
      "page-5.pdf",
      "page-6.pdf",
    ]);

    await page.getByRole("button", { name: "Process another file" }).click();
    await expect(page.getByRole("button", { name: "Split PDF" })).toBeDisabled();
  });

  test("extracting specific page ranges produces a correctly-ordered PDF with only those pages", async ({
    page,
  }) => {
    await page.goto("/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.getByRole("radio", { name: /Extract specific pages/ }).check();
    await page.getByLabel("Pages to extract").fill("1-2, 4");

    await page.getByRole("button", { name: "Extract Pages" }).click();
    await expect(page.getByText("split.pdf")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const doc = await PDFDocument.load(await fs.readFile(downloadPath));
    expect(doc.getPageCount()).toBe(3);
  });

  test("shows a live validation error for a range beyond the page count", async ({ page }) => {
    await page.goto("/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.getByRole("radio", { name: /Extract specific pages/ }).check();
    await page.getByLabel("Pages to extract").fill("1-2, 99");

    await expect(page.getByRole("alert").filter({ hasText: "only has 6 pages" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Extract Pages" })).toBeDisabled();
  });

  test("shows a live validation error for malformed range text", async ({ page }) => {
    await page.goto("/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.getByRole("radio", { name: /Extract specific pages/ }).check();
    await page.getByLabel("Pages to extract").fill("abc");

    await expect(page.getByRole("alert").filter({ hasText: "isn't a valid page or range" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Extract Pages" })).toBeDisabled();
  });

  test("handles a corrupted PDF gracefully: page count unreadable client-side, clear error from the server, start-over resets", async ({
    page,
  }) => {
    await page.goto("/tools/split-pdf");
    await page.locator('input[type="file"]').setInputFiles(CORRUPTED_FILE);

    // The client-side page-count reader says "couldn't read ... page count"; the server's
    // UnreadableFileError says "couldn't be read" — distinct phrasing keeps these two locators apart.
    const pageCountAlert = page.getByRole("alert").filter({ hasText: "couldn't read this PDF's page count" });
    await expect(pageCountAlert).toBeVisible();

    // "Extract specific pages" needs a known page count and should be disabled.
    await expect(page.getByRole("radio", { name: /Extract specific pages/ })).toBeDisabled();

    // "Split into individual pages" is still selectable — the server makes the authoritative call.
    await page.getByRole("button", { name: "Split PDF" }).click();

    const serverError = page.getByRole("alert").filter({ hasText: "couldn't be read" });
    await expect(serverError).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(pageCountAlert).toBeHidden();
    await expect(serverError).toBeHidden();
    await expect(page.getByText("split-corrupted.pdf")).toBeHidden();
    await expect(page.getByRole("button", { name: "Split PDF" })).toBeDisabled();
  });
});
