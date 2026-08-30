import { test, expect } from '@playwright/test';

const defaultHeroImage = 'photo-1516690561799-46d8f74f90f6';

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`${viewport.name} does not render the default hero image while CMS data is loading`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

  // During the loading phase the hero remains a neutral surface. If an image
  // is already present (for example from a warm Firestore/cache path), it must
  // be the current CMS value rather than the former hardcoded default.
    const initialHeroSources = await page.locator('img[alt="Himalayan mountain backdrop"], img[alt="Himalayan mobile tour"]')
      .evaluateAll((images) => images.map((image) => image.getAttribute('src') || ''));
    expect(initialHeroSources.every((source) => !source.includes(defaultHeroImage))).toBe(true);

  // The default must never reappear after the CMS state settles either.
    await expect(page.locator(`img[src*="${defaultHeroImage}"]`)).toHaveCount(0);
  });
}
