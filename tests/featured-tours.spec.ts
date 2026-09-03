import { test, expect, type Locator, type Page } from '@playwright/test';

const primaryDestinations = ['Uttarakhand', 'Ladakh', 'Himachal', 'International'];
const countries = ['Indonesia', 'Maldives', 'Singapore', 'Sri Lanka', 'Thailand', 'United Arab Emirates', 'Vietnam'];

const featuredSection = (page: Page) => page.locator('section#featured-packages');

async function waitForPackageData(page: Page) {
  const section = featuredSection(page);
  await expect(section.getByRole('heading', { name: /Featured Tours for the way you wander/ })).toBeVisible();
  const cookieBanner = page.getByRole('region', { name: 'Cookie consent' });
  if (await cookieBanner.isVisible().catch(() => false)) {
    await cookieBanner.getByRole('button', { name: 'Decline' }).click();
  }
  await expect(section.locator('.pravaah-featured-carousel')).toBeVisible({ timeout: 30_000 });
}

async function clickTab(section: Locator, name: string) {
  await section.getByRole('tab', { name, exact: true }).first().click();
  await expect(section.getByRole('tab', { name, exact: true }).first()).toHaveAttribute('aria-selected', 'true');
}

async function inspectCards(section: Locator) {
  const showcase = section.locator('.pravaah-featured-carousel');
  await expect(showcase).toBeVisible();
  const activeCard = showcase.locator('.pravaah-featured-carousel__active-card');
  const railCards = showcase.locator('.pravaah-featured-carousel__rail-card:not(.pravaah-featured-carousel__rail-card--coming)');
  if (await activeCard.count() === 0) {
    await expect(showcase.locator('.pravaah-featured-carousel__empty')).toContainText('New featured journeys are taking shape.');
    return { showcase, cardCount: 0 };
  }
  await expect(activeCard).toBeVisible();
  await expect(activeCard.getByRole('button', { name: /View details/ })).toBeVisible();
  await expect(activeCard.locator('img')).toBeVisible();
  if (await railCards.count()) {
    await expect(railCards.first()).toBeVisible();
  } else {
    await expect(showcase.locator('.pravaah-featured-carousel__rail-card--coming')).toBeVisible();
  }
  return { showcase, cardCount: await railCards.count() };
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
      await inspectCards(section);
    }

    await clickTab(section, 'International');
    const secondary = section.locator('ul').nth(1).getByRole('tab');
    await expect(secondary).toHaveText(countries);
    expect((await secondary.allTextContents()).some((text) => text.trim() === 'India')).toBe(false);

    for (const country of countries) {
      await clickTab(section, country);
      await inspectCards(section);
      const showcaseText = await section.locator('.pravaah-featured-carousel').innerText();
      expect(showcaseText).not.toMatch(/Jim Corbett|Valley of Flowers|Rishikesh Adventure Escape/);
      if (!showcaseText.includes('New featured journeys are taking shape.')) {
        expect(showcaseText).toContain(country === 'United Arab Emirates' ? 'Dubai' : country === 'Indonesia' ? 'Bali' : country);
      }
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  });

  for (const viewport of [
    { name: 'desktop compact', width: 1280, height: 800 },
    { name: 'tablet', width: 1024, height: 768 },
    { name: 'tablet portrait', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'mobile compact', width: 375, height: 812 },
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

  test('master-detail switching updates the active card, story, rail, and actions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForPackageData(page);
    const section = featuredSection(page);
    await clickTab(section, 'Uttarakhand');
    const showcase = section.locator('.pravaah-featured-carousel');
    const activeCard = showcase.locator('.pravaah-featured-carousel__active-card');
    if (await activeCard.count() === 0) {
      await expect(showcase.locator('.pravaah-featured-carousel__empty')).toContainText('New featured journeys are taking shape.');
      return;
    }

    const initialTitle = await activeCard.locator('h3').innerText();
    const initialImage = await activeCard.locator('img').getAttribute('src');
    const initialStory = await showcase.locator('.pravaah-featured-carousel__editorial h3').innerText();
    const firstRailCard = showcase.locator('.pravaah-featured-carousel__rail-card:not(.pravaah-featured-carousel__rail-card--coming)').first();
    await expect(firstRailCard).toBeVisible();
    const nextTitle = await firstRailCard.locator('strong').innerText();

    await firstRailCard.click();
    await expect(activeCard.locator('h3')).toHaveText(nextTitle);
    await expect(showcase.locator('.pravaah-featured-carousel__editorial h3')).not.toHaveText(initialStory);
    await expect(showcase.locator('.pravaah-featured-carousel__rail')).toContainText(initialTitle);
    expect(await activeCard.locator('img').getAttribute('src')).not.toBe(initialImage);

    await showcase.getByRole('button', { name: 'Next featured journey' }).click();
    await showcase.getByRole('button', { name: 'Previous featured journey' }).click();
    await expect(activeCard.locator('h3')).toHaveText(nextTitle);

    await showcase.getByRole('button', { name: 'Enquire now' }).click();
    await expect(page.getByRole('dialog', { name: /Plan a trip/ })).toBeVisible();
    await page.getByRole('button', { name: 'Close enquiry' }).click();

    await showcase.getByRole('button', { name: /View details/ }).click();
    await expect(page).toHaveURL(/\/packages\//);
  });
});
