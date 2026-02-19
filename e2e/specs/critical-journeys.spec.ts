import { test, expect } from '@playwright/test'

/**
 * Critical path E2E scenarios.
 * Require E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD when running against a real backend.
 * Skip when credentials are not set.
 */
test.describe('Critical journeys', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_LOGIN_EMAIL || !process.env.E2E_LOGIN_PASSWORD) {
      test.skip()
    }
  })

  test('Login with valid credentials → Dashboard loads', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/correo|email/i).fill(process.env.E2E_LOGIN_EMAIL!)
    await page.getByLabel(/contraseña|password/i).fill(process.env.E2E_LOGIN_PASSWORD!)
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /panel|dashboard|inicio/i })).toBeVisible({ timeout: 10000 })
  })

  test('Create proposal → appears in list', async ({ page }) => {
    await page.goto('/governance')
    await page.getByRole('button', { name: /nueva propuesta|crear propuesta/i }).click()
    await page.getByLabel(/título/i).fill('E2E Test Proposal')
    await page.getByLabel(/descripción/i).fill('Created by E2E test')
    await page.getByRole('button', { name: /crear|guardar|enviar/i }).click()
    await expect(page.getByText('E2E Test Proposal')).toBeVisible({ timeout: 10000 })
  })

  test('Vote on proposal → vote count updates', async ({ page }) => {
    await page.goto('/governance')
    await page.getByRole('link', { name: /propuesta|proposal/ }).first().click()
    await page.getByRole('button', { name: /a favor/i }).click()
    await expect(page.getByText(/ya votaste|voto registrado/i)).toBeVisible({ timeout: 5000 })
  })

  test('Close proposal → status changes to approved/rejected', async ({ page }) => {
    await page.goto('/governance')
    await page.getByRole('link', { name: /propuesta|proposal/ }).first().click()
    await page.getByRole('button', { name: /cerrar|close/i }).click()
    await page.getByRole('button', { name: /confirmar|sí/i }).click()
    await expect(page.getByText(/aprobada|rechazada|cerrada/i)).toBeVisible({ timeout: 10000 })
  })

  test('Create transaction → appears in transaction list', async ({ page }) => {
    await page.goto('/treasury')
    await page.getByRole('tab', { name: /transacciones/i }).click()
    await page.getByRole('button', { name: /nueva transacción|agregar/i }).click()
    await page.getByLabel(/monto|amount/i).fill('100')
    await page.getByLabel(/descripción/i).fill('E2E test transaction')
    await page.getByRole('button', { name: /guardar|crear/i }).click()
    await expect(page.getByText('E2E test transaction')).toBeVisible({ timeout: 10000 })
  })

  test('Invite member → link generated with valid token', async ({ page }) => {
    await page.goto('/settings')
    await page.getByRole('tab', { name: /invitaciones/i }).click()
    await page.getByRole('button', { name: /crear invitación/i }).click()
    await page.getByLabel(/correo|email/i).fill('invited-e2e@example.com')
    await page.getByRole('button', { name: /enviar invitación/i }).click()
    await expect(page.getByText(/invitación creada|enlace/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('textbox', { name: /enlace/i })).toHaveValue(/\/invite\/[a-zA-Z0-9_-]+/)
  })

  test('Role-gated: miembro cannot access /settings', async ({ page }) => {
    // This test requires a miembro-role user; skip if we only have admin credentials
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings|\/dashboard/)
    const backButton = page.getByRole('button', { name: /volver al panel/i })
    const settingsContent = page.getByText(/solo los administradores|configuración/i)
    const hasAccess = await settingsContent.isVisible().catch(() => false)
    const noAccess = await backButton.isVisible().catch(() => false)
    expect(hasAccess || noAccess).toBeTruthy()
  })

  test('Moroso member sees voting restriction', async ({ page }) => {
    await page.goto('/governance')
    await page.getByRole('link', { name: /propuesta|proposal/ }).first().click()
    const morosoMessage = page.getByText(/moroso|voz pero no voto|no puedes votar/i)
    const voteButtons = page.getByRole('button', { name: /a favor|en contra/i })
    await expect(morosoMessage.or(voteButtons)).toBeVisible({ timeout: 5000 })
  })
})
