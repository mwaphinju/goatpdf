import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const PHOTO1 = path.join(FIXTURES_DIR, "convert-photo1.jpg");
const PHOTO2 = path.join(FIXTURES_DIR, "convert-photo2.jpg");
const PNG_PHOTO = path.join(FIXTURES_DIR, "convert-photo3.png");
const CORRUPTED_JPG = path.join(FIXTURES_DIR, "convert-corrupted.jpg");

test.describe("JPG to PDF", () => {
  test("starts with an empty state and a disabled action button", async ({ page }) => {
    await page.goto("/tools/jpg-to-pdf");
    await expect(page.getByRole("heading", { level: 1, name: "JPG to PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Convert to PDF" })).toBeDisabled();
  });

  test("accepts JPG and PNG together, lists them in order, and converts to a matching page count", async ({
    page,
  }) => {
    await page.goto("/tools/jpg-to-pdf");
    await page.locator('input[type="file"]').setInputFiles([PHOTO1, PHOTO2, PNG_PHOTO]);

    const list = page.getByRole("list", { name: "Files to convert, in order" });
    await expect(list.getByRole("listitem")).toHaveCount(3);
    await expect(list.getByRole("listitem").nth(0)).toContainText("convert-photo1.jpg");
    await expect(list.getByRole("listitem").nth(2)).toContainText("convert-photo3.png");

    await page.route("**/api/jpg-to-pdf", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByRole("button", { name: "Convert to PDF" }).click();
    await expect(page.getByText("Converting your images")).toBeVisible();
    await expect(page.getByText("images.pdf")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("images.pdf");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const doc = await PDFDocument.load(await fs.readFile(downloadPath));
    expect(doc.getPageCount()).toBe(3);

    await page.getByRole("button", { name: "Process another file" }).click();
    await expect(page.getByRole("button", { name: "Convert to PDF" })).toBeDisabled();
  });

  test("reordering with the move buttons changes the resulting page order", async ({ page }) => {
    await page.goto("/tools/jpg-to-pdf");
    await page.locator('input[type="file"]').setInputFiles([PHOTO1, PHOTO2]);

    const list = page.getByRole("list", { name: "Files to convert, in order" });
    await expect(list.getByRole("listitem").nth(0)).toContainText("convert-photo1.jpg");

    await page.getByRole("button", { name: "Move convert-photo1.jpg down" }).click();

    await expect(list.getByRole("listitem").nth(0)).toContainText("convert-photo2.jpg");
    await expect(list.getByRole("listitem").nth(1)).toContainText("convert-photo1.jpg");
  });

  test("disables orientation when 'Fit to image' page size is selected", async ({ page }) => {
    await page.goto("/tools/jpg-to-pdf");
    await page.locator('input[type="file"]').setInputFiles(PHOTO1);

    await expect(page.getByRole("radio", { name: "portrait" })).toBeEnabled();
    await page.getByRole("radio", { name: /^Fit to image/ }).check();
    await expect(page.getByRole("radio", { name: "portrait" })).toBeDisabled();
    await expect(page.getByRole("radio", { name: "landscape" })).toBeDisabled();
  });

  test("shows a clear error for a corrupted image file, and start-over resets", async ({ page }) => {
    await page.goto("/tools/jpg-to-pdf");
    await page.locator('input[type="file"]').setInputFiles([PHOTO1, CORRUPTED_JPG]);

    await page.getByRole("button", { name: "Convert to PDF" }).click();

    const errorAlert = page.getByRole("alert").filter({ hasText: "couldn't be read" });
    await expect(errorAlert).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(errorAlert).toBeHidden();
    await expect(page.getByRole("button", { name: "Convert to PDF" })).toBeDisabled();
  });
});
