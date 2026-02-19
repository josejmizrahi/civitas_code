import { test as setup } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

/**
 * Log in once and save storage state for reuse.
 * Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD in env (e.g. .env.e2e) for real runs.
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_LOGIN_EMAIL
  const password = process.env.E2E_LOGIN_PASSWORD
  if (!email || !password) {
    setup.skip()
    return
  }
  await page.goto('/login')
  await page.getByLabel(/correo|email/i).fill(email)
  await page.getByLabel(/contraseña|password/i).fill(password)
  await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  await page.context().storageState({ path: authFile })
})
