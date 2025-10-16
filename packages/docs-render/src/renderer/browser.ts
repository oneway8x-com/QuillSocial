import { chromium, Browser } from "playwright";

let browser: Browser | null = null;

export async function launchBrowser() {
  if (browser) return browser;
  browser = await chromium.launch({ headless: true });
  return browser;
}

export async function closeBrowser() {
  if (!browser) return;
  await browser.close();
  browser = null;
}
