import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const SOURCE_FILE = path.join(FIXTURES_DIR, "rotate-source.pdf"); // 4 pages
const CORRUPTED_FILE = path.join(FIXTURES_DIR, "rotate-corrupted.pdf");

test.describe("Rotate PDF", () => {
  test("starts with an empty state and a disabled action button", async ({ page }) => {
    await page.goto("/tools/rotate-pdf");
    await expect(page.getByRole("heading", { level: 1, name: "Rotate PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rotate PDF" })).toBeDisabled();
  });

  test("shows the page count and defaults to 90° / all pages", async ({ page }) => {
    await page.goto("/tools/rotate-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);

    await expect(page.getByText("This PDF has")).toContainText("4");
    await expect(page.getByRole("radio", { name: "90°" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Rotate every page" })).toBeChecked();
    await expect(page.getByRole("button", { name: "Rotate PDF" })).toBeEnabled();
  });

  test("rotating all pages at 180° produces a PDF with every page rotated", async ({ page }) => {
    await page.goto("/tools/rotate-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.getByRole("radio", { name: "180°" }).check();

    await page.route("**/api/rotate-pdf", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByRole("button", { name: "Rotate PDF" }).click();
    await expect(page.getByText("Rotating your PDF")).toBeVisible();
    await expect(page.getByText("rotated.pdf")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("rotated.pdf");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const doc = await PDFDocument.load(await fs.readFile(downloadPath));
    const rotations = doc.getPages().map((p) => p.getRotation().angle);
    expect(rotations).toEqual([180, 180, 180, 180]);

    await page.getByRole("button", { name: "Process another file" }).click();
    await expect(page.getByRole("button", { name: "Rotate PDF" })).toBeDisabled();
  });

  test("rotating only selected pages leaves the rest untouched", async ({ page }) => {
    await page.goto("/tools/rotate-pdf");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.getByRole("radio", { name: "Choose specific pages" }).check();
    await page.getByRole("button", { name: "Page 2" }).click();
    await page.getByRole("button", { name: "Page 4" }).click();
    await expect(page.getByText("2 of 4 selected")).toBeVisible();

    await page.getByRole("button", { name: "Rotate PDF" }).click();
    await expect(page.getByText("rotated.pdf")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const doc = await PDFDocument.load(await fs.readFile(downloadPath));
    const rotations = doc.getPages().map((p) => p.getRotation().angle);
    expect(rotations).toEqual([0, 90, 0, 90]);
  });

  test("handles a corrupted PDF: page-specific mode disabled, server rejects with a clear error, start-over resets", async ({
    page,
  }) => {
    await page.goto("/tools/rotate-pdf");
    await page.locator('input[type="file"]').setInputFiles(CORRUPTED_FILE);

    const pageCountAlert = page.getByRole("alert").filter({ hasText: "couldn't read this PDF's page count" });
    await expect(pageCountAlert).toBeVisible();
    await expect(page.getByRole("radio", { name: "Choose specific pages" })).toBeDisabled();

    await page.getByRole("button", { name: "Rotate PDF" }).click();
    const serverError = page.getByRole("alert").filter({ hasText: "couldn't be read" });
    await expect(serverError).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(pageCountAlert).toBeHidden();
    await expect(serverError).toBeHidden();
    await expect(page.getByRole("button", { name: "Rotate PDF" })).toBeDisabled();
  });
});
