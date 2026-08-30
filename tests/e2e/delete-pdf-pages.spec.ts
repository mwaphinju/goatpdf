import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const SOURCE_FILE = path.join(FIXTURES_DIR, "delete-source.pdf"); // 5 pages, widths 200..204
const CORRUPTED_FILE = path.join(FIXTURES_DIR, "delete-corrupted.pdf");

test.describe("Delete PDF Pages", () => {
  test("starts with an empty state and a disabled action button", async ({ page }) => {
    await page.goto("/tools/delete-pdf-pages");
    await expect(page.getByRole("heading", { level: 1, name: "Delete PDF Pages" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete Pages" })).toBeDisabled();
  });

  test("shows the page count and a page picker after uploading", async ({ page }) => {
    await page.goto("/tools/delete-pdf-pages");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);

    await expect(page.getByText("This PDF has")).toContainText("5");
    await expect(page.getByRole("group", { name: "Pages to delete" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete Pages" })).toBeDisabled();
  });

  test("deletes exactly the selected pages and keeps the rest, in order", async ({ page }) => {
    await page.goto("/tools/delete-pdf-pages");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.getByRole("button", { name: "Page 2" }).click();
    await page.getByRole("button", { name: "Page 4" }).click();
    await expect(page.getByRole("button", { name: "Delete 2 Pages" })).toBeEnabled();

    await page.route("**/api/delete-pdf-pages", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByRole("button", { name: "Delete 2 Pages" }).click();
    await expect(page.getByText("Removing pages")).toBeVisible();
    await expect(page.getByText("pages-removed.pdf")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("pages-removed.pdf");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const doc = await PDFDocument.load(await fs.readFile(downloadPath));
    expect(doc.getPageCount()).toBe(3);
    const widths = doc.getPages().map((p) => p.getWidth());
    expect(widths).toEqual([200, 202, 204]); // original pages 1, 3, 5 survive

    await page.getByRole("button", { name: "Process another file" }).click();
    await expect(page.getByRole("button", { name: "Delete Pages" })).toBeDisabled();
  });

  test("blocks deleting every page and explains why", async ({ page }) => {
    await page.goto("/tools/delete-pdf-pages");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    for (let i = 1; i <= 5; i++) {
      await page.getByRole("button", { name: `Page ${i}` }).click();
    }

    await expect(page.getByText("You can't delete every page")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Delete/ })).toBeDisabled();
  });

  test("handles a corrupted PDF gracefully: no page picker, clear error, start-over resets", async ({ page }) => {
    await page.goto("/tools/delete-pdf-pages");
    await page.locator('input[type="file"]').setInputFiles(CORRUPTED_FILE);

    const pageCountAlert = page.getByRole("alert").filter({ hasText: "couldn't read this PDF's page count" });
    await expect(pageCountAlert).toBeVisible();
    await expect(page.getByRole("group", { name: "Pages to delete" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Delete Pages" })).toBeDisabled();

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(pageCountAlert).toBeHidden();
    await expect(page.getByText("delete-corrupted.pdf")).toBeHidden();
  });
});
