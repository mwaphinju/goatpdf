import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const SOURCE_FILE = path.join(FIXTURES_DIR, "word-source.pdf");
const CORRUPTED_FILE = path.join(FIXTURES_DIR, "word-corrupted.pdf");

test.describe("PDF to Word", () => {
  test("starts with an empty state and a disabled action button", async ({ page }) => {
    await page.goto("/tools/pdf-to-word");
    await expect(page.getByRole("heading", { level: 1, name: "PDF to Word" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Convert to Word" })).toBeDisabled();
  });

  test("shows a formatting disclaimer before converting — never claims a perfect conversion", async ({ page }) => {
    await page.goto("/tools/pdf-to-word");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);

    await expect(page.getByText("Before you convert")).toBeVisible();
    await expect(page.getByText(/may not come out exactly as they looked in the original/i)).toBeVisible();
  });

  test("converts a multi-page PDF with headings, a table, an image, and multiple fonts into a downloadable docx", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/tools/pdf-to-word");
    await page.locator('input[type="file"]').setInputFiles(SOURCE_FILE);

    await page.getByRole("button", { name: "Convert to Word" }).click();
    await expect(page.getByText("Converting your PDF to Word")).toBeVisible();
    await expect(page.getByText("converted.docx")).toBeVisible({ timeout: 75_000 });

    // The formatting disclaimer is repeated on the success screen too.
    await expect(page.getByText("Please double-check the formatting")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("converted.docx");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const bytes = await fs.readFile(downloadPath);
    expect(bytes.byteLength).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(bytes);
    expect(zip.file("word/document.xml")).not.toBeNull();
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Word Conversion Test Document");

    await page.getByRole("button", { name: "Process another file" }).click();
    await expect(page.getByRole("button", { name: "Convert to Word" })).toBeDisabled();
  });

  test("shows a clear, non-committal error for a corrupted PDF, and start-over resets", async ({ page }) => {
    await page.goto("/tools/pdf-to-word");
    await page.locator('input[type="file"]').setInputFiles(CORRUPTED_FILE);

    await page.getByRole("button", { name: "Convert to Word" }).click();

    const errorAlert = page.getByRole("alert").filter({ hasText: "couldn't be read" });
    await expect(errorAlert).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(errorAlert).toBeHidden();
    await expect(page.getByRole("button", { name: "Convert to Word" })).toBeDisabled();
  });
});
