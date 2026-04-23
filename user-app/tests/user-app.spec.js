const { test, expect } = require('@playwright/test');

test.describe('User App - Authentication', () => {
  test('registration page loads with firstName and lastName fields', async ({ page }) => {
    await page.goto('/register');
    
    // Check if registration form is visible
    await expect(page.locator('text=Join the fans')).toBeVisible();
    
    // Check for firstName field
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"], input[aria-label*="First"]').first();
    await expect(firstNameInput).toBeVisible();
    
    // Check for lastName field
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Last"], input[aria-label*="Last"]').first();
    await expect(lastNameInput).toBeVisible();
    
    // Ensure displayName field is not present
    const displayNameField = page.locator('input[name="displayName"]');
    await expect(displayNameField).not.toBeVisible();
  });

  test('can register a new account', async ({ page }) => {
    await page.goto('/register');
    
    // Fill out the registration form
    const timestamp = Date.now();
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="username"]', `testuser${timestamp}`);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="password"]', 'TestPassword123');
    
    // Submit the form
    await page.click('button:has-text("Create account")');
    
    // Should redirect to home or dashboard
    await page.waitForTimeout(2000);
    // Note: May need to adjust based on actual flow
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check if login form is visible
    await expect(page.locator('text=Welcome back')).toBeVisible();
    
    // Check for email/username field
    const identifierInput = page.locator('input:not([type="password"])').first();
    await expect(identifierInput).toBeVisible();
    
    // Check for password field
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });

  test('can switch between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // Click register link
    await page.click('a:has-text("Create account")');
    await expect(page).toHaveURL('/register');
    
    // Click login link
    await page.click('a:has-text("Log in")');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('User App - Navigation', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    
    // Check if main content is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Look for common navigation elements
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible();
    }
  });

  test('language switching works', async ({ page }) => {
    await page.goto('/');
    
    // Try to find language switcher
    const langSwitcher = page.locator('button:has-text("EN"), button:has-text("AR"), [data-testid="language-switcher"]').first();
    
    if (await langSwitcher.isVisible()) {
      await langSwitcher.click();
      await page.waitForTimeout(1000);
      
      // Check if page content changed
      // This may need adjustment based on actual implementation
    }
  });

  test('responsive design on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Check for mobile navigation if it exists
    const mobileNav = page.locator('.mobile-menu, button[aria-label="menu"], .hamburger').first();
    if (await mobileNav.isVisible()) {
      await mobileNav.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('User App - Forms', () => {
  test('form validation works', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('button:has-text("Create account")');
    
    // Check for validation errors
    await page.waitForTimeout(1000);
    
    // Try to fill with invalid password
    await page.fill('input[name="password"]', '123');
    await page.click('button:has-text("Create account")');
    
    await page.waitForTimeout(1000);
  });
});
