import { test as base } from '@playwright/test'

/**
 * Fixture that provides a logged-in page using storageState.
 * Run auth.setup.ts first to populate storageState (e.g. login and save storage).
 */
export const test = base.extend<object, { storageState: string }>({
  storageState: [
    async (_, use) => {
      const path = process.env.PLAYWRIGHT_AUTH_STATE_PATH || 'e2e/.auth/user.json'
      await use(path)
    },
    { scope: 'worker' },
  ],
})

export { expect } from '@playwright/test'
