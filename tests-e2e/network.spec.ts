import { test, expect } from "@playwright/test";

test.describe("Network", () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto("http://localhost:5173/");

    // Create a new account
    await page.click('button:has-text("Get Started")');
    await page.click('button:has-text("Create New Account")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Start Using Notention")');
  });

  test("should find and display matching notes", async ({ page, context }) => {
    // Create a new page for the second user
    const page2 = await context.newPage();
    await page2.goto("http://localhost:5173/");

    // Create a note in the first user's page
    await page.click('button:has-text("New Note")');
    await page.fill('input[name="title"]', "Note 1");
    await page.locator(".tiptap-editor").type("This is a note about #testing.");
    await page.click('button:has-text("Save")');
    await page.click('button:has-text("Publish")');

    // Create a note in the second user's page
    await page2.click('button:has-text("New Note")');
    await page2.fill('input[name="title"]', "Note 2");
    await page2
      .locator(".tiptap-editor")
      .type("This is another note about #testing.");
    await page2.click('button:has-text("Save")');
    await page2.click('button:has-text("Publish")');

    // Go to the network page in the first user's page
    await page.click('button:has-text("Network")');

    // Check that the matching note is displayed
    await expect(page.locator(".match-note h4")).toHaveText(
      "Remote Note: Note 2",
    );
  });
});
