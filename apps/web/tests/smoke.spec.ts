import { test, expect } from '@playwright/test'

test('Decision + Redline path', async ({ page }) => {
  await page.goto('/plan')
  // Open first decision
  const firstDecision = page.locator('section button').first()
  await firstDecision.click()
  // Attempt approve
  const approve = page.getByRole('button', { name: 'Approve' })
  await approve.click()
  // Redline may appear if over budget
  // We just assert page still responsive
  await expect(page).toHaveTitle(/Autopilot/)
})

