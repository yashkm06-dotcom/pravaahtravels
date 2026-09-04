import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function captureScreenshots() {
  const outputDir = path.resolve('/Users/air/.gemini/antigravity-ide/brain/533b6037-70a0-40dd-8bc1-1813e287bc90/screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'desktop_1440x900', width: 1440, height: 900 },
    { name: 'laptop_1280x800', width: 1280, height: 800 },
    { name: 'tablet_landscape_1024x768', width: 1024, height: 768 },
    { name: 'tablet_portrait_768x1024', width: 768, height: 1024 },
    { name: 'mobile_iphone14_390x844', width: 390, height: 844 },
    { name: 'mobile_compact_375x812', width: 375, height: 812 },
  ];

  const routes = [
    { path: '/ladakh', label: 'ladakh' },
    { path: '/himachal-trek', label: 'himachal' },
  ];

  for (const route of routes) {
    for (const vp of viewports) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });

      try {
        console.log(`Navigating to http://localhost:3000${route.path} @ ${vp.name}...`);
        await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000);
        
        // Take hero screenshot
        const heroFile = path.join(outputDir, `${route.label}_hero_${vp.name}.png`);
        await page.screenshot({ path: heroFile, fullPage: false });

        // Take full-page screenshot
        const fullFile = path.join(outputDir, `${route.label}_full_${vp.name}.png`);
        await page.screenshot({ path: fullFile, fullPage: true });

        console.log(`Saved screenshots for ${route.label} @ ${vp.name}`);
      } catch (err) {
        console.error(`Error capturing ${route.label} @ ${vp.name}:`, err);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  console.log('Finished capturing all audit screenshots!');
}

captureScreenshots();
