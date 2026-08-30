import { expect, test } from "@playwright/test";

const TOOLS = [
  { slug: "compress-pdf", name: "Compress PDF" },
  { slug: "merge-pdf", name: "Merge PDF" },
  { slug: "split-pdf", name: "Split PDF" },
  { slug: "rotate-pdf", name: "Rotate PDF" },
  { slug: "delete-pages", name: "Delete PDF Pages" },
  { slug: "jpg-to-pdf", name: "JPG to PDF" },
  { slug: "pdf-to-jpg", name: "PDF to JPG" },
  { slug: "pdf-to-word", name: "PDF to Word" },
];

test("homepage shows the headline, supporting text, and all 8 tool cards", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Free PDF Tools That Just Work" })).toBeVisible();
  await expect(page.getByText("Compress, merge, split and convert PDF files online")).toBeVisible();

  const toolsSection = page.locator("#tools");
  for (const tool of TOOLS) {
    await expect(toolsSection.getByRole("link", { name: new RegExp(`^${tool.name}`) })).toBeVisible();
  }
});

test("homepage footer links reach every tool page", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer).toBeVisible();

  for (const tool of TOOLS) {
    await expect(footer.getByRole("link", { name: tool.name })).toBeVisible();
  }
});

test("clicking a tool card navigates to its tool page", async ({ page }) => {
  await page.goto("/");
  await page.locator("#tools").getByRole("link", { name: /^Merge PDF/ }).click();
  await expect(page).toHaveURL(/\/tools\/merge-pdf$/);
  await expect(page.getByRole("heading", { level: 1, name: "Merge PDF" })).toBeVisible();
});
