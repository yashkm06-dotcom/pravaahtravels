import { test, expect, type Locator, type Page } from '@playwright/test';

const primaryDestinations = ['Uttarakhand', 'Ladakh', 'Himachal', 'International'];
const countries = ['Indonesia', 'Maldives', 'Singapore', 'Sri Lanka', 'Thailand', 'United Arab Emirates', 'Vietnam'];

const featuredSection = (page: Page) => page.locator('section#featured-packages');

async function waitForPackageData(page: Page) {
  const section = featuredSection(page);
  await expect(section.getByRole('heading', { name: /Amazing Featured Tour/ })).toBeVisible();
  await expect(section.locator('article').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Roopkund Trek', { exact: true })).toBeVisible({ timeout: 30_000 });
}

async function clickTab(section: Locator, name: string) {
  await section.getByRole('tab', { name, exact: true }).first().click();
  await expect(section.getByRole('tab', { name, exact: true }).first()).toHaveAttribute('aria-selected', 'true');
}

async function inspectCards(section: Locator) {
  const cards = section.locator('article');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  const texts = await cards.allTextContents();
  for (const card of await cards.all()) {
    const bookNow = card.getByRole('button', { name: 'Book Now', exact: true });
    const viewDetails = card.getByRole('button', { name: 'View Details', exact: true });
    if (await bookNow.count() === 0) continue;
    const cardBox = await card.boundingBox();
    const bookBox = await bookNow.boundingBox();
    const detailsBox = await viewDetails.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(bookBox).not.toBeNull();
    expect(detailsBox).not.toBeNull();
    if (!cardBox || !bookBox || !detailsBox) continue;
    for (const buttonBox of [bookBox, detailsBox]) {
      expect(buttonBox.x).toBeGreaterThanOrEqual(cardBox.x);
      expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 0.5);
    }
    expect(bookBox.y + bookBox.height).toBeLessThanOrEqual(detailsBox.y + 0.5);
  }
  const placeholderCount = texts.filter((text) => text.includes('More Coming Soon')).length;
  const realCount = count - placeholderCount;
  expect(realCount + placeholderCount).toBe(count);
  const cardGrid = section.locator('[data-featured-total-count]').first();
  const logicalRealCount = Number(await cardGrid.getAttribute('data-featured-real-count'));
  const logicalPlaceholderCount = Number(await cardGrid.getAttribute('data-featured-placeholder-count'));
  const logicalTotalCount = Number(await cardGrid.getAttribute('data-featured-total-count'));
  expect(logicalRealCount).toBeGreaterThanOrEqual(0);
  expect(logicalRealCount).toBeLessThanOrEqual(4);
  expect(logicalPlaceholderCount).toBe(1);
  expect(logicalTotalCount).toBeLessThanOrEqual(5);
  expect(logicalTotalCount).toBe(logicalRealCount + 1);
  if (logicalRealCount >= 4) {
    expect(logicalRealCount).toBe(4);
    expect(logicalTotalCount).toBe(5);
  }
  return { cards, texts, placeholderCount, realCount, logicalRealCount };
}

test.describe('Featured Tours', () => {
  test('desktop categories, placeholders, and International isolation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForPackageData(page);
    const section = featuredSection(page);

    await expect(section.locator('ul').first().getByRole('tab')).toHaveCount(4);
    for (const destination of primaryDestinations) {
      await clickTab(section, destination);
      const { cards } = await inspectCards(section);
      expect(await cards.count()).toBeGreaterThanOrEqual(3);
    }

    await clickTab(section, 'International');
    const secondary = section.locator('ul').nth(1).getByRole('tab');
    await expect(secondary).toHaveText(countries);
    expect((await secondary.allTextContents()).some((text) => text.trim() === 'India')).toBe(false);

    for (const country of countries) {
      await clickTab(section, country);
      const { texts } = await inspectCards(section);
      expect(texts.join(' ')).not.toMatch(/Jim Corbett|Valley of Flowers|Rishikesh Adventure Escape/);
      const realTexts = texts.filter((text) => !text.includes('More Coming Soon'));
      if (realTexts.length > 0) expect(realTexts.join(' ')).toContain(country === 'United Arab Emirates' ? 'Dubai' : country === 'Indonesia' ? 'Bali' : country);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  });

  for (const viewport of [
    { name: 'tablet', width: 1024, height: 768 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`${viewport.name} responsive International filters`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await waitForPackageData(page);
      const section = featuredSection(page);
      await clickTab(section, 'International');
      await expect(section.locator('ul').nth(1).getByRole('tab')).toHaveText(countries);
      for (const country of countries) {
        await clickTab(section, country);
        await inspectCards(section);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    });
  }
});
