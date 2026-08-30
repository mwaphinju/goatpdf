import { expect, test } from "@playwright/test";

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

// The "coming soon" ToolPageShell flow (previously tested here against whichever
// tool was still unimplemented) no longer has a live route to test against — all
// 8 tools now have real implementations, each covered by its own tests/e2e/*.spec.ts.
// ToolPageShell.tsx itself is unused dead weight at this point and could be removed.

test("404 page renders for an unknown tool slug", async ({ page }) => {
  const response = await page.goto("/tools/does-not-exist");
  expect(response?.status()).toBe(404);
});
