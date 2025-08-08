import { test } from '@playwright/test'
import { loginWithStorageState } from '../../helpers/auth-persistent'

test('debug weekmenu state', async ({ page }) => {
  await loginWithStorageState(page)
  
  // Check localStorage state
  const localStorageState = await page.evaluate(() => {
    const weekmenu = localStorage.getItem('weekmenu')
    const auth = localStorage.getItem('sb-padeskjkdetesmfuicvm-auth-token')
    return {
      hasWeekMenu: !!weekmenu,
      weekMenu: weekmenu ? JSON.parse(weekmenu) : null,
      hasAuth: !!auth
    }
  })
  
  console.log('=== Initial localStorage State ===')
  console.log('Has weekmenu:', localStorageState.hasWeekMenu)
  console.log('Weekmenu:', localStorageState.weekMenu)
  console.log('Has auth:', localStorageState.hasAuth)
  
  // Wait a bit and check again
  await page.waitForTimeout(2000)
  
  const updatedState = await page.evaluate(() => {
    const weekmenu = localStorage.getItem('weekmenu')
    return weekmenu ? JSON.parse(weekmenu) : null
  })
  
  console.log('\n=== After 2 seconds ===')
  console.log('Weekmenu:', updatedState)
  
  // Check what React Query is doing
  const queryState = await page.evaluate(() => {
    // Try to access React Query state
    const reactQuery = window.__REACT_QUERY_DEVTOOLS_GLOBAL_STATE__
    if (reactQuery) {
      const queries = Array.from(reactQuery.queries.values())
      return queries.map(q => ({
        queryKey: q.queryKey,
        state: q.state.status,
        dataUpdatedAt: q.state.dataUpdatedAt
      }))
    }
    return null
  })
  
  console.log('\n=== React Query State ===')
  console.log('Queries:', queryState)
})