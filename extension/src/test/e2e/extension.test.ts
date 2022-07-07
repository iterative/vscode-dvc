import { suite, before, describe, it } from 'mocha'
import {
  BasePage,
  IPageDecorator,
  PageDecorator,
  ViewControl
} from 'wdio-vscode-service'
import { delay } from '../../util/time'

const webviewLocators = {
  expandRowButton: 'button[title="Expand Row"]',
  innerFrame: '#active-frame',
  outerFrame: '.webview.ready',
  row: '[role=row]',
  table: '[role=table]'
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Webview extends IPageDecorator<typeof webviewLocators> {}
@PageDecorator(webviewLocators)
class Webview extends BasePage<
  typeof webviewLocators,
  {
    webview: typeof webviewLocators
  }
> {
  /**
   * @private locator key to identify locator map (see locators.ts)
   */
  public locatorKey = 'webview' as const

  public async open() {
    const webviewContainer = await this.outerFrame$

    await this.outerFrame$.waitForDisplayed()

    await browser.switchToFrame(webviewContainer)
    await this.innerFrame$.waitForDisplayed()
    const webviewInner = await browser.findElement(
      'css selector',
      this.locators.innerFrame
    )
    await browser.switchToFrame(webviewInner)
  }

  public async close() {
    await browser.switchToFrame(null)
    await browser.switchToFrame(null)
  }

  public async expandAllRows() {
    const expandRowButtons = await this.expandRowButton$$
    for (const button of expandRowButtons) {
      button.click()
    }
    return expandRowButtons.length === 0
  }
}

const getDVCActivityBarIcon = async (): Promise<ViewControl> => {
  const workbench = await browser.getWorkbench()

  const activityBar = workbench.getActivityBar()

  await browser.waitUntil(
    async () => !!(await activityBar.getViewControl('DVC'))
  )
  return activityBar.getViewControl('DVC') as Promise<ViewControl>
}

const dismissAllNotifications = () =>
  browser.waitUntil(async () => {
    const workbench = await browser.getWorkbench()
    const notifications = await workbench.getNotifications()
    for (const n of notifications) {
      await n.dismiss()
    }
    const openNotifications = await workbench.getNotifications()
    return openNotifications.length === 0
  })

const waitForViewContainerToLoad = async () => {
  await browser.waitUntil(async () => {
    const dvcIcon = await getDVCActivityBarIcon()
    if (!dvcIcon) {
      return false
    }

    const view = await dvcIcon.openView()
    return !!view
  })

  return browser.waitUntil(async () => {
    const progressBars = await $$('.monaco-progress-container')

    if (progressBars.length === 0) {
      return false
    }

    for (const progress of progressBars) {
      if ((await progress.getAttribute('aria-hidden')) !== 'true') {
        return false
      }
    }

    return true
  })
}

suite('DVC Extension For Visual Studio Code', () => {
  before('should finish loading the extension', async () => {
    await waitForViewContainerToLoad()
    return dismissAllNotifications()
  })

  // avoid killing exp show after experiments have finished run
  after(() => delay(30000))

  describe('Activity Bar', () => {
    it('should show the DVC Icon', async () => {
      const dvcIcon = await getDVCActivityBarIcon()
      expect(await dvcIcon.getTitle()).toBe('DVC')
    })
  })

  describe('Experiments Table Webview', () => {
    const webview = new Webview({ webview: webviewLocators })

    it('should load as an editor', async () => {
      const workbench = await browser.getWorkbench()

      await workbench.executeCommand('DVC: Show Experiments')

      await webview.open()

      await browser.waitUntil(async () => {
        const table = await webview.table$
        return table.isDisplayed()
      })

      expect(await webview.table$$).toHaveLength(1)
    })

    it('should update with a new row for each checkpoint when an experiment is running', async () => {
      await browser.switchToFrame(null)
      const workbench = await browser.getWorkbench()
      const epochs = 15
      await workbench.executeCommand('DVC: Reset and Run Experiment')

      await webview.open()

      await browser.waitUntil(() => webview.expandAllRows())

      const initialRows = await webview.row$$

      expect(initialRows.length).toBeGreaterThanOrEqual(4)

      await browser.waitUntil(
        async () => {
          await webview.expandAllRows()
          const currentRows = await webview.row$$
          return currentRows.length >= initialRows.length + epochs
        },
        { timeout: 120000 }
      )

      const finalRows = await webview.row$$

      expect(finalRows.length).toStrictEqual(initialRows.length + epochs)
    }).timeout(180000)
  })
})
