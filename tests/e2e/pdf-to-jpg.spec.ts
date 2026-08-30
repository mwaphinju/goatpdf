import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const SOURCE_FILE = path.join(FIXTURES_DIR, "render-source.pdf"); // 4 pages
const CORRUPTED_FILE = path.join(FIXTURES_DIR, "render-corrupted.pdf");

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

test.describe("PDF to JPG", () => {
  test("starts with an empty state and a disabled action button", async ({ page }) => {
    await page.goto("/tools/pdf-to-jpg");
    await expect(page.getByRole("heading", { level: 1, name: "PDF to JPG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Convert to JPG" })).toBeDisabled();
  });

  test("shows the page count and defaults to Medium quality / all pages", async ({ page }) => {
    await page.goto("/tools/pdf-to-jpg");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);

    await expect(page.getByText("This PDF has")).toContainText("4");
    await expect(page.getByRole("radio", { name: /^Medium/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: "All pages" })).toBeChecked();
    await expect(page.getByRole("button", { name: "Convert to JPG" })).toBeEnabled();
  });

  test("converting all pages produces a ZIP with one JPEG per page", async ({ page }) => {
    await page.goto("/tools/pdf-to-jpg");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.route("**/api/pdf-to-jpg", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByRole("button", { name: "Convert to JPG" }).click();
    await expect(page.getByText("Converting your PDF to images")).toBeVisible();
    await expect(page.getByText("pages.zip")).toBeVisible({ timeout: 20_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("pages.zip");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const zip = await JSZip.loadAsync(await fs.readFile(downloadPath));
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual(["page-1.jpg", "page-2.jpg", "page-3.jpg", "page-4.jpg"]);

    for (const name of names) {
      const bytes = await zip.files[name].async("nodebuffer");
      expect(isJpeg(bytes)).toBe(true);
    }
  });

  test("converting exactly one selected page downloads a single JPEG directly", async ({ page }) => {
    await page.goto("/tools/pdf-to-jpg");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);
    await expect(page.getByText("This PDF has")).toBeVisible();

    await page.getByRole("radio", { name: "Select pages" }).check();
    await page.getByRole("button", { name: "Page 2" }).click();
    await expect(page.getByText("1 of 4 selected")).toBeVisible();

    await page.getByRole("button", { name: "Convert to JPG" }).click();
    await expect(page.getByText("page.jpg")).toBeVisible({ timeout: 20_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("page.jpg");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    expect(isJpeg(await fs.readFile(downloadPath))).toBe(true);
  });

  test("handles a corrupted PDF gracefully, and start-over resets", async ({ page }) => {
    await page.goto("/tools/pdf-to-jpg");
    await page.locator('input[type="file"]').setInputFiles(CORRUPTED_FILE);

    const pageCountAlert = page.getByRole("alert").filter({ hasText: "couldn't read this PDF's page count" });
    await expect(pageCountAlert).toBeVisible();

    await page.getByRole("button", { name: "Convert to JPG" }).click();
    const serverError = page.getByRole("alert").filter({ hasText: "couldn't be read" });
    await expect(serverError).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(pageCountAlert).toBeHidden();
    await expect(serverError).toBeHidden();
  });
});
