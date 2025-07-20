import { test, expect } from "@playwright/test";

test.describe("Note Editors", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto("http://localhost:5173/");

    // Create a new account
    await page.click('button:has-text("Get Started")');
    await page.click('button:has-text("Create New Account")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Start Using Notention")');

    // Create a new note
    await page.click('button:has-text("New Note")');
  });

  test("TipTap editor should work", async ({ page }) => {
    // Select the TipTap editor
    await page.click('select[aria-label="Note Editor"]');
    await page.selectOption('select[aria-label="Note Editor"]', "tiptap");

    // Check that the editor is visible
    const editor = await page.locator(".tiptap-editor");
    await expect(editor).toBeVisible();

    // Type some text
    await editor.type("Hello, TipTap!");
    await expect(editor).toHaveText("Hello, TipTap!");
  });

  test("Quill editor should work", async ({ page }) => {
    // Select the Quill editor
    await page.click('select[aria-label="Note Editor"]');
    await page.selectOption('select[aria-label="Note Editor"]', "quill");

    // Check that the editor is visible
    const editor = await page.locator(".ql-editor");
    await expect(editor).toBeVisible();

    // Type some text
    await editor.type("Hello, Quill!");
    await expect(editor).toHaveText("Hello, Quill!");
  });

  test("Minimal editor should work", async ({ page }) => {
    // Select the Minimal editor
    await page.click('select[aria-label="Note Editor"]');
    await page.selectOption('select[aria-label="Note Editor"]', "minimal");

    // Check that the editor is visible
    const editor = await page.locator(".minimal-content-textarea");
    await expect(editor).toBeVisible();

    // Type some text
    await editor.type("Hello, Minimal!");
    await expect(editor).toHaveValue("Hello, Minimal!");
  });

  test("Markdown editor should work", async ({ page }) => {
    // Select the Markdown editor
    await page.click('select[aria-label="Note Editor"]');
    await page.selectOption('select[aria-label="Note Editor"]', "markdown");

    // Check that the editor is visible
    const editor = await page.locator(".markdown-textarea");
    await expect(editor).toBeVisible();

    // Type some text
    await editor.type("Hello, Markdown!");
    await expect(editor).toHaveValue("Hello, Markdown!");

    // Check the preview
    const preview = await page.locator(".markdown-preview-content");
    await expect(preview).toHaveText("Hello, Markdown!");
  });
});
