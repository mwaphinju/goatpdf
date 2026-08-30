import { expect, test } from "@playwright/test";
import path from "node:path";

const TOOLS = [
  { slug: "compress-pdf", name: "Compress PDF" },
  { slug: "merge-pdf", name: "Merge PDF" },
  { slug: "split-pdf", name: "Split PDF" },
  { slug: "rotate-pdf", name: "Rotate PDF" },
  { slug: "delete-pdf-pages", name: "Delete PDF Pages" },
  { slug: "jpg-to-pdf", name: "JPG to PDF" },
  { slug: "pdf-to-jpg", name: "PDF to JPG" },
  { slug: "pdf-to-word", name: "PDF to Word" },
];

for (const tool of TOOLS) {
  test(`${tool.name} page loads with an upload zone and correct title`, async ({ page }) => {
    await page.goto(`/tools/${tool.slug}`);

    await expect(page).toHaveTitle(new RegExp(tool.name));
    await expect(page.getByRole("heading", { level: 1, name: tool.name })).toBeVisible();
    await expect(page.getByRole("button", { name: /browse files|drag and drop/i })).toBeVisible();
  });
}

test("selecting a file enables the action button and shows the coming-soon notice", async ({ page }) => {
  // compress-pdf is still an unimplemented placeholder (uses the generic ToolPageShell) —
  // rotate-pdf, used here originally, has a real implementation as of Phase 5.
  await page.goto("/tools/compress-pdf");

  const actionButton = page.getByRole("button", { name: "Compress PDF" });
  await expect(actionButton).toBeDisabled();

  const filePath = path.join(__dirname, "fixtures", "sample.pdf");
  await page.locator('input[type="file"]').setInputFiles(filePath);

  await expect(page.getByText("sample.pdf")).toBeVisible();
  await expect(actionButton).toBeEnabled();

  await actionButton.click();
  await expect(page.getByText("This tool is coming soon")).toBeVisible();
});

test("404 page renders for an unknown tool slug", async ({ page }) => {
  const response = await page.goto("/tools/does-not-exist");
  expect(response?.status()).toBe(404);
});
