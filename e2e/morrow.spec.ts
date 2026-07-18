import { expect, test } from '@playwright/test'
import { createScenario } from '../src/data/catalog'
import { encodeScenario } from '../src/domain/share'

test('core demo journey reaches the rehearsal cockpit and assumption atlas', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /inspect the cascade/i })).toBeVisible()
  await page.getByRole('button', { name: /run the 72-hour rehearsal/i }).click()
  await expect(page.getByRole('heading', { name: /cyclone nila/i })).toBeVisible()
  await expect(page.getByLabel(/crisis timeline hour/i)).toBeVisible()
  await page.getByRole('button', { name: 'Cascade' }).first().click()
  await expect(page.getByRole('heading', { name: /see how the model propagates pressure/i })).toBeVisible()
  await page.getByRole('button', { name: /health-system load/i }).click()
  await expect(page.getByText(/combined care pressure/i)).toBeVisible()
})

test('mobile layout keeps the primary actions reachable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-only assertion')
  await page.goto('/#/cockpit/command')
  await expect(page.getByRole('navigation', { name: /mobile cockpit views/i })).toBeVisible()
  await page.getByLabel(/active scenario/i).selectOption('urban-earthquake')
  await expect(page.getByLabel(/active scenario/i)).toHaveValue('urban-earthquake')
  await expect(page.getByLabel(/crisis timeline hour/i)).toBeVisible()
  await page.getByRole('button', { name: 'Optimize' }).last().click()
  await expect(page.getByRole('heading', { name: /no single .*best.* plan/i })).toBeVisible()
})

test('production PWA shell survives an offline reload', async ({ page, context, isMobile }) => {
  test.skip(isMobile, 'One production service-worker verification is sufficient')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /inspect the cascade/i })).toBeVisible()
  const cachedBuildAssets = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable in this browser.')
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(
          () => reject(new Error('The service worker did not take control of the page.')),
          5_000,
        )
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {
            window.clearTimeout(timeout)
            resolve()
          },
          { once: true },
        )
      })
    }
    const cache = await caches.open('morrow-v2')
    return (await cache.keys()).map((request) => new URL(request.url).pathname)
  })
  expect(cachedBuildAssets.some((path) => path.endsWith('.js'))).toBe(true)
  expect(cachedBuildAssets.some((path) => path.endsWith('.css'))).toBe(true)
  expect(cachedBuildAssets).toContain('/THIRD_PARTY_NOTICES.md')
  expect(cachedBuildAssets).toContain('/licenses/SIL-OFL-1.1.txt')
  await context.setOffline(true)
  try {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /inspect the cascade/i })).toBeVisible()
  } finally {
    await context.setOffline(false)
  }
})

test('switching scenarios cancels an in-flight portfolio search', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The desktop selector provides the shortest race regression path')
  await page.goto('/#/cockpit/compare')
  await page.getByRole('button', { name: /find objective winners/i }).click()
  await expect(page.getByRole('heading', { name: /screening constrained portfolios/i })).toBeVisible()
  await page.waitForTimeout(250)
  const cancellationStarted = Date.now()
  await page.getByLabel(/active scenario/i).selectOption('heat-water-grid')
  await expect(page.getByLabel(/active scenario/i)).toHaveValue('heat-water-grid')
  expect(Date.now() - cancellationStarted).toBeLessThan(750)
  await page.waitForTimeout(500)
  await expect(page.getByText(/four explicit objective winners are one search away/i)).toBeVisible()
  await expect(page.getByRole('region', { name: /optimized portfolio options/i })).toHaveCount(0)
})

test('portfolio search yields to interaction and avoids multi-second main-thread tasks', async ({ page, isMobile }) => {
  test.skip(isMobile, 'One Chromium performance contract is sufficient')
  await page.goto('/#/cockpit/compare')
  await page.evaluate(() => {
    type InstrumentedWindow = Window & {
      __morrowLongTasks?: number[]
      __morrowLongTaskObserver?: PerformanceObserver
    }
    const instrumented = window as InstrumentedWindow
    instrumented.__morrowLongTasks = []
    if (!PerformanceObserver.supportedEntryTypes.includes('longtask')) return
    instrumented.__morrowLongTaskObserver = new PerformanceObserver((list) => {
      instrumented.__morrowLongTasks?.push(...list.getEntries().map((entry) => entry.duration))
    })
    instrumented.__morrowLongTaskObserver.observe({ entryTypes: ['longtask'] })
  })

  await page.getByRole('button', { name: /find objective winners/i }).click()
  await expect(page.getByRole('heading', { name: /screening constrained portfolios/i })).toBeVisible()
  const navigationStarted = Date.now()
  await page.getByRole('button', { name: 'Cascade' }).first().click()
  await expect(page.getByRole('heading', { name: /see how the model propagates pressure/i })).toBeVisible()
  expect(Date.now() - navigationStarted).toBeLessThan(2_000)
  await expect(page.getByText(/four objective winners found/i)).toBeVisible({ timeout: 15_000 })

  const maximumLongTask = await page.evaluate(() => {
    type InstrumentedWindow = Window & {
      __morrowLongTasks?: number[]
      __morrowLongTaskObserver?: PerformanceObserver
    }
    const instrumented = window as InstrumentedWindow
    instrumented.__morrowLongTaskObserver?.disconnect()
    return Math.max(0, ...(instrumented.__morrowLongTasks ?? []))
  })
  expect(maximumLongTask).toBeLessThan(500)
})

test('the command palette enters a consistent cockpit route from landing', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop keyboard-command regression')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /inspect the cascade/i })).toBeVisible()
  await page.keyboard.press('Control+K')
  await page.getByRole('option', { name: /open evidence ledger/i }).click()
  await expect(page.getByRole('heading', { name: /trust is a product feature/i })).toBeFocused()
  await expect(page).toHaveURL(/#\/cockpit\/evidence$/)
})

test('the complete decision brief remains scrollable inside its modal', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop modal regression; mobile uses the same scroll container')
  await page.goto('/#/cockpit/command')
  await page.getByRole('button', { name: 'Brief', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: /cyclone nila/i })
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  await dialog.evaluate((element) => element.scrollTo({ top: element.scrollHeight }))
  expect(await dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
})

test('same-tab share navigation validates and applies each scenario without losing the current state on errors', async ({ page, isMobile }) => {
  test.skip(isMobile, 'One same-document navigation regression is sufficient')
  const heatShare = `#/cockpit&s=${encodeURIComponent(encodeScenario(createScenario('heat-water-grid')))}`
  const earthquakeShare = `#/cockpit&s=${encodeURIComponent(encodeScenario(createScenario('urban-earthquake')))}`
  const outOfRangeStress = createScenario('coastal-cyclone')
  outOfRangeStress.stress = 81
  const invalidStressShare = `#/cockpit&s=${encodeURIComponent(encodeScenario(outOfRangeStress))}`

  await page.goto('/#/cockpit/command')

  await page.evaluate((hash) => { window.location.hash = hash }, heatShare)
  await expect(page.getByLabel(/active scenario/i)).toHaveValue('heat-water-grid')
  await expect(page.getByText(/opened shared scenario: the long heat response/i)).toBeVisible()

  await page.evaluate((hash) => {
    window.history.pushState(null, '', hash)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, earthquakeShare)
  await expect(page.getByLabel(/active scenario/i)).toHaveValue('urban-earthquake')

  await page.evaluate(() => { window.location.hash = '#/cockpit&s=v1.%25%25%25' })
  await expect(page.getByText(/share code contains invalid characters/i)).toBeVisible()
  await expect(page.getByLabel(/active scenario/i)).toHaveValue('urban-earthquake')

  await page.evaluate((hash) => { window.location.hash = hash }, invalidStressShare)
  await expect(page.locator('.toast-error').last()).toContainText(/stress|80|too_big|too big/i)
  await expect(page.getByLabel(/active scenario/i)).toHaveValue('urban-earthquake')
})

test('320px and 375px cockpit routes have no horizontal content clipping', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile viewport regression')
  const routes = ['command', 'cascade', 'compare', 'evidence'] as const

  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 })
    for (const route of routes) {
      await page.goto(`/#/cockpit/${route}`)
      await expect(page.locator('.command-center, .page-view')).toBeVisible()
      const layout = await page.evaluate(() => {
        const main = document.querySelector<HTMLElement>('.cockpit-main')
        if (!main) throw new Error('Cockpit main region was not rendered.')
        return {
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
          mainClientWidth: main.clientWidth,
          mainScrollWidth: main.scrollWidth,
        }
      })
      expect(layout.documentWidth, `${route} document at ${width}px`).toBeLessThanOrEqual(layout.viewport + 1)
      expect(layout.bodyWidth, `${route} body at ${width}px`).toBeLessThanOrEqual(layout.viewport + 1)
      expect(layout.mainScrollWidth, `${route} main at ${width}px`).toBeLessThanOrEqual(layout.mainClientWidth + 1)
    }
  }
})
