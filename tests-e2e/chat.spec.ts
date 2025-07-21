import { test, expect } from "@playwright/test";

test.describe("Chat", () => {
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

  test("should be able to send and receive direct messages", async ({
    page,
    context,
  }) => {
    // Create a new page for the second user
    const page2 = await context.newPage();
    await page2.goto("http://localhost:5173/");

    // Get the public key of the second user
    const pubkey2 = await page2.evaluate(
      () => localStorage.getItem("nostrPublicKey") || "",
    );

    // Add the second user as a contact in the first user's page
    await page.click('button:has-text("Contacts")');
    await page.fill('input[name="pubkey"]', pubkey2);
    await page.fill('input[name="alias"]', "User 2");
    await page.click('button:has-text("Add Contact")');

    // Go to the chat page
    await page.click('button:has-text("Chats")');

    // Select the contact
    await page.click('li:has-text("User 2")');

    // Send a message
    await page.fill('input[name="message"]', "Hello, User 2!");
    await page.click('button:has-text("Send")');

    // Check that the message is displayed
    await expect(page.locator(".message-bubble")).toHaveText("Hello, User 2!");

    // In the second user's page, check that the message is received
    await page2.click('button:has-text("Chats")');
    await expect(page2.locator(".message-bubble")).toHaveText("Hello, User 2!");
  });

  test("should be able to send and receive public messages", async ({
    page,
    context,
  }) => {
    // Create a new page for the second user
    const page2 = await context.newPage();
    await page2.goto("http://localhost:5173/");

    // Go to the chat page
    await page.click('button:has-text("Chats")');
    await page.click('li:has-text("Public Chat")');

    // Send a message
    await page.fill('input[name="message"]', "Hello, everyone!");
    await page.click('button:has-text("Send")');

    // Check that the message is displayed
    await expect(page.locator(".message-bubble")).toHaveText("Hello, everyone!");

    // In the second user's page, check that the message is received
    await page2.click('button:has-text("Chats")');
    await page2.click('li:has-text("Public Chat")');
    await expect(page2.locator(".message-bubble")).toHaveText(
      "Hello, everyone!",
    );
  });
});
