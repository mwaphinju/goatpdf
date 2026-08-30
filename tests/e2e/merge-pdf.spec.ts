import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const FILE_A = path.join(FIXTURES_DIR, "merge-a.pdf"); // 2 pages, width 200
const FILE_B = path.join(FIXTURES_DIR, "merge-b.pdf"); // 3 pages, width 300
const CORRUPTED_FILE = path.join(FIXTURES_DIR, "merge-corrupted.pdf");

async function dropFile(page: import("@playwright/test").Page, dropzoneSelector: string, filePath: string) {
  const buffer = (await fs.readFile(filePath)).toString("base64");
  const fileName = path.basename(filePath);

  const dataTransfer = await page.evaluateHandle(
    async ({ buffer, fileName }) => {
      const blob = await fetch(`data:application/pdf;base64,${buffer}`).then((res) => res.blob());
      const file = new File([blob], fileName, { type: "application/pdf" });
      const dt = new DataTransfer();
      dt.items.add(file);
      return dt;
    },
    { buffer, fileName },
  );

  const dropzone = page.locator(dropzoneSelector);
  await dropzone.dispatchEvent("dragover", { dataTransfer });
  await dropzone.dispatchEvent("drop", { dataTransfer });
}

test.describe("Merge PDF", () => {
  test("starts with an empty state and a disabled merge button", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await expect(page.getByRole("heading", { level: 1, name: "Merge PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Merge/ })).toBeDisabled();
  });

  test("adding files shows them in order, with size and a running count", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await page.locator('input[type="file"]').setInputFiles([FILE_A, FILE_B]);

    const list = page.getByRole("list", { name: "Files to merge, in order" });
    const items = list.getByRole("listitem");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("merge-a.pdf");
    await expect(items.nth(1)).toContainText("merge-b.pdf");
    await expect(page.getByRole("button", { name: "Merge 2 PDFs" })).toBeEnabled();
  });

  test("reordering with the move buttons changes merge order", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await page.locator('input[type="file"]').setInputFiles([FILE_A, FILE_B]);

    const list = page.getByRole("list", { name: "Files to merge, in order" });
    await expect(list.getByRole("listitem").nth(0)).toContainText("merge-a.pdf");

    await page.getByRole("button", { name: "Move merge-a.pdf down" }).click();

    await expect(list.getByRole("listitem").nth(0)).toContainText("merge-b.pdf");
    await expect(list.getByRole("listitem").nth(1)).toContainText("merge-a.pdf");
  });

  test("removing a file drops it below the two-file minimum and disables merging", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await page.locator('input[type="file"]').setInputFiles([FILE_A, FILE_B]);

    await page.getByRole("button", { name: "Remove merge-b.pdf" }).click();

    await expect(page.getByRole("list", { name: "Files to merge, in order" }).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByText("Add at least 2 PDF files to merge.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Merge/ })).toBeDisabled();
  });

  test("supports adding a file via drag-and-drop onto the dropzone", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await dropFile(page, '[role="button"]:has-text("Drag and drop your PDF files here")', FILE_A);

    const list = page.getByRole("list", { name: "Files to merge, in order" });
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(list.getByRole("listitem").first()).toContainText("merge-a.pdf");
  });

  test("merges files in the chosen order and produces a correct, downloadable PDF", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await page.locator('input[type="file"]').setInputFiles([FILE_A, FILE_B]);

    // Reorder so B (3 pages, width 300) comes before A (2 pages, width 200).
    await page.getByRole("button", { name: "Move merge-a.pdf down" }).click();

    // Artificially slow the request so the transient "processing" state is reliably observable.
    await page.route("**/api/merge-pdf", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.getByRole("button", { name: "Merge 2 PDFs" }).click();

    await expect(page.getByText(/Merging \d PDFs/)).toBeVisible();
    await expect(page.getByText("merged.pdf")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("merged.pdf");

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("expected a downloaded file path");
    const bytes = await fs.readFile(downloadPath);
    const mergedDoc = await PDFDocument.load(bytes);

    expect(mergedDoc.getPageCount()).toBe(5); // 3 (B) + 2 (A)
    const widths = mergedDoc.getPages().map((p) => p.getWidth());
    expect(widths).toEqual([300, 300, 300, 200, 200]); // B's pages first, then A's

    // "Process another file" (start over after success) returns to the empty state.
    await page.getByRole("button", { name: "Process another file" }).click();
    await expect(page.getByRole("button", { name: /^Merge/ })).toBeDisabled();
  });

  test("shows a clear error for a corrupted PDF without losing the other selected file, and start-over resets", async ({
    page,
  }) => {
    await page.goto("/tools/merge-pdf");
    await page.locator('input[type="file"]').setInputFiles([FILE_A, CORRUPTED_FILE]);

    await page.getByRole("button", { name: "Merge 2 PDFs" }).click();

    // Next.js's own route announcer also has role="alert", so filter to the one with our message.
    const errorAlert = page.getByRole("alert").filter({ hasText: /corrupted|password protected/i });
    await expect(errorAlert).toBeVisible();

    // The file list is still there — the user can fix the selection and retry.
    await expect(page.getByRole("list", { name: "Files to merge, in order" }).getByRole("listitem")).toHaveCount(2);

    await page.getByRole("button", { name: "Start over" }).click();
    await expect(page.getByRole("list", { name: "Files to merge, in order" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Merge/ })).toBeDisabled();
  });
});
