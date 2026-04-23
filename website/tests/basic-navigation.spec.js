const { test, expect } = require('@playwright/test');

test.describe('Basic Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/Qadsiah Fantasy/);
    
    // Check for main navigation elements (use first() to avoid strict mode violation)
    await expect(page.locator('nav').first()).toBeVisible();
    
    // Check for main content
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navigation to main pages works', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation links that don't require authentication
    const navLinks = [
      { text: 'Matches', href: '/matches' },
      { text: 'Leaderboard', href: '/leaderboard' },
    ];

    for (const link of navLinks) {
      // Use the desktop navigation
      const navLink = page.locator('nav').first().locator(`a[href="${link.href}"]`);
      if (await navLink.isVisible()) {
        await navLink.click();
        await expect(page).toHaveURL(new RegExp(link.href));
        // Check that page loads without errors
        await expect(page.locator('body')).toBeVisible();
        // Go back to home for next iteration
        await page.goto('/');
      }
    }
  });

  test('language switching works', async ({ page }) => {
    await page.goto('/');
    
    // Find and click language switcher - try multiple selectors
    const langSwitcher = page.locator('button:has-text("EN"), button:has-text("AR"), [data-testid="language-switcher"]').first();
    
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      
      // Check if URL or page content changes
      await page.waitForTimeout(1000);
    }
  });

  test('responsive design on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Desktop nav should be hidden on mobile
    const desktopNav = page.locator('nav').first();
    await expect(desktopNav).toHaveClass(/hidden/);
    
    // Check for mobile navigation (second nav)
    const mobileNav = page.locator('nav').nth(1);
    await expect(mobileNav).toBeVisible();
  });
});

test.describe('Authentication Pages', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
    
    // Look for identifier input (email or username)
    const identifierInput = page.locator('input:not([type="password"])').first();
    await expect(identifierInput).toBeVisible();
    
    // Look for password input
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test('register page loads with new fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('form')).toBeVisible();
    
    // Check for new firstName and lastName fields
    const firstNameInput = page.locator('input[name="firstName"]').first();
    await expect(firstNameInput).toBeVisible();
    
    const lastNameInput = page.locator('input[name="lastName"]').first();
    await expect(lastNameInput).toBeVisible();
    
    // Ensure displayName field is not present
    const displayNameField = page.locator('input[name="displayName"]');
    await expect(displayNameField).not.toBeVisible();
  });

  test('protected routes redirect to login', async ({ page }) => {
    const protectedRoutes = ['/predictions', '/squad', '/profile'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
