import { test, expect } from '@playwright/test'
import { ensureLoggedOut } from '../helpers/auth-real'

test.describe('Sign Up Flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page)
    await page.goto('/weekmenu/')
  })

  test('should display sign up form when clicking switch link', async ({ page }) => {
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    await expect(page.getByText('Create your account')).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeVisible()
  })

  test('should validate required fields on sign up', async ({ page }) => {
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    await page.getByRole('button', { name: 'Sign Up' }).click()
    
    await expect(page.getByLabel('Full Name')).toBeFocused()
  })

  test.skip('should successfully sign up with valid credentials', async ({ page }) => {
    // Skip this test as it creates real users in the test database
    // which can cause issues with test isolation
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    const uniqueEmail = `test_${Date.now()}@example.com`
    
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill(uniqueEmail)
    await page.getByLabel('Password').fill('password123')
    
    await page.getByRole('button', { name: 'Sign Up' }).click()
    
    await expect(page.getByRole('button', { name: 'Loading...' })).toBeVisible()
    
    await page.waitForURL('/weekmenu/', { timeout: 30000 })
    
    await expect(page.getByText('Weekmenu')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Up' })).not.toBeVisible()
    
    const authToken = await page.evaluate(() => localStorage.getItem('sb-padeskjkdetesmfuicvm-auth-token'))
    expect(authToken).toBeTruthy()
  })

  test('should show error when signing up with existing email', async ({ page }) => {
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    
    await page.getByRole('button', { name: 'Sign Up' }).click()
    
    await expect(page.getByText(/User already registered|email.*already.*registered/i)).toBeVisible({ timeout: 10000 })
  })

  test('should switch between login and signup forms', async ({ page }) => {
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    await expect(page.getByLabel('Full Name')).not.toBeVisible()
    
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    await expect(page.getByText('Create your account')).toBeVisible()
    await expect(page.getByLabel('Full Name')).toBeVisible()
    
    await page.getByRole('button', { name: "Already have an account? Sign in" }).click()
    
    await expect(page.getByText('Sign in to your account')).toBeVisible()
    await expect(page.getByLabel('Full Name')).not.toBeVisible()
  })

  test('should have Google sign-in option available', async ({ page }) => {
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    const googleButton = page.getByRole('button', { name: 'Continue with Google' })
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeEnabled()
  })

  test('should preserve form data when switching between login and signup', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('mypassword')
    
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    await expect(page.getByLabel('Email')).toHaveValue('test@example.com')
    await expect(page.getByLabel('Password')).toHaveValue('mypassword')
  })

  test.skip('should show loading state during sign up', async ({ page }) => {
    // Skip this test as it creates real users in the test database
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    const uniqueEmail = `test_${Date.now()}@example.com`
    
    await page.getByLabel('Full Name').fill('Test User')
    await page.getByLabel('Email').fill(uniqueEmail)
    await page.getByLabel('Password').fill('password123')
    
    const signUpButton = page.getByRole('button', { name: 'Sign Up' })
    await signUpButton.click()
    
    await expect(page.getByRole('button', { name: 'Loading...' })).toBeVisible()
    await expect(signUpButton).not.toBeVisible()
  })

  test('should enforce minimum password length', async ({ page }) => {
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click()
    
    const passwordInput = page.getByLabel('Password')
    await expect(passwordInput).toHaveAttribute('minlength', '6')
  })
})