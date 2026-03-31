import { test as teardown } from '@playwright/test'
import { cleanupTestData } from './helpers/supabase'

teardown('cleanup test data', async () => {
  try {
    await cleanupTestData()
    console.log('[E2E] Test data cleanup complete')
  } catch (error) {
    console.warn('[E2E] Cleanup failed (non-blocking):', error)
    // Don't fail the suite on cleanup errors
  }
})
