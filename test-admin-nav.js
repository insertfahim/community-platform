// Test script to verify admin dashboard visibility
const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Go to auth page
    await page.goto("http://localhost:3000/auth.html");

    // Login as admin
    await page.type("#username", "admin");
    await page.type("#password", "admin");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForNavigation();

    // Check if admin dashboard link is visible
    const adminLink = await page.$("[data-requires-admin]");
    const isVisible = await page.evaluate(
        (el) => el.style.display !== "none",
        adminLink
    );

    console.log("Admin dashboard link is visible:", isVisible);

    // Navigate to feed page
    await page.goto("http://localhost:3000/feed.html");

    // Check if admin dashboard link is still visible on feed page
    const adminLinkOnFeed = await page.$("[data-requires-admin]");
    const isVisibleOnFeed = await page.evaluate(
        (el) => el.style.display !== "none",
        adminLinkOnFeed
    );

    console.log(
        "Admin dashboard link is visible on feed page:",
        isVisibleOnFeed
    );

    await browser.close();
})();
