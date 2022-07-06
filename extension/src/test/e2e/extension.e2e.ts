import {
  BasePage,
  IPageDecorator,
  PageDecorator,
  ViewControl
} from 'wdio-vscode-service'

const webviewLocators = {
  innerFrame: '#active-frame',
  outerFrame: '.webview.ready',
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

const waitForViewContainerToLoad = () =>
  browser.waitUntil(async () => {
    const dvcIcon = await getDVCActivityBarIcon()
    if (!dvcIcon) {
      return false
    }

    const view = await dvcIcon.openView()
    const progressBars = await $$('.monaco-progress-container')

    if (!view) {
      return false
    }

    for (const progress of progressBars) {
      if ((await progress.getAttribute('aria-hidden')) !== 'true') {
        return false
      }
    }

    return !!view
  })

describe('DVC Extension For Visual Studio Code', () => {
  before('should finish loading the extension', async () => {
    await waitForViewContainerToLoad()
    return dismissAllNotifications()
  })

  it('should show the DVC Icon in Activity Bar', async () => {
    const dvcIcon = await getDVCActivityBarIcon()
    expect(await dvcIcon.getTitle()).toBe('DVC')
  })

  it('should load the experiments table', async () => {
    const workbench = await browser.getWorkbench()

    await workbench.executeCommand('DVC: Show Experiments')

    const webview = new Webview({ webview: webviewLocators })
    await webview.open()

    await browser.waitUntil(async () => {
      const table = await webview.table$
      return table.isDisplayed()
    })

    expect(await webview.table$$).toHaveLength(1)
  })
})
