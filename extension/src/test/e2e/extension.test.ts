import { suite, before, describe, it } from 'mocha'
import { ViewControl } from 'wdio-vscode-service'
import { ExperimentsWebview } from './pageObjects/experimentsWebview'
import { PlotsWebview } from './pageObjects/plotsWebview'
import { delay } from '../../util/time'

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
  const initialProgressBars = await $$('.monaco-progress-container')
  await browser.waitUntil(async () => {
    const dvcIcon = await getDVCActivityBarIcon()
    if (!dvcIcon) {
      return false
    }

    const view = await dvcIcon.openView()

    return !!view
  })

  return browser.waitUntil(async () => {
    const numberOfProgressBarsInContainer = 7
    const currentProgressBars = await $$('.monaco-progress-container')

    if (
      currentProgressBars.length <
      initialProgressBars.length + numberOfProgressBarsInContainer
    ) {
      return false
    }

    for (const progress of currentProgressBars) {
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

  // avoid killing any background process after experiments have finished run
  after(() => delay(30000))

  afterEach(() => browser.switchToFrame(null))

  describe('Activity Bar', () => {
    it('should show the DVC Icon', async () => {
      const dvcIcon = await getDVCActivityBarIcon()
      expect(await dvcIcon.getTitle()).toBe('DVC')
    })
  })

  describe('Experiments Table Webview', () => {
    const webview = new ExperimentsWebview('experiments')

    it('should load as an editor', async () => {
      const workbench = await browser.getWorkbench()

      await workbench.executeCommand('DVC: Show Experiments')

      await webview.open()

      await browser.waitUntil(async () => {
        const table = await webview.table$
        return table.isDisplayed()
      })

      expect(await webview.table$$).toHaveLength(1)

      await webview.close()
    })

    it('should update with a new row for each checkpoint when an experiment is running', async () => {
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
      await webview.close()
    }).timeout(180000)
  })

  describe('Plots Webview', () => {
    before(async () => {
      const workbench = await browser.getWorkbench()
      const editorView = workbench.getEditorView()
      return editorView.closeAllEditors()
    })

    const webview = new PlotsWebview('plots')

    it('should load the plots webview with non-empty plots', async () => {
      const workbench = await browser.getWorkbench()
      await workbench.executeCommand('DVC: Show Plots')

      await webview.open()

      await browser.waitUntil(async () => {
        const vegaVisualization = await webview.vegaVisualization$
        return vegaVisualization.isDisplayed()
      })

      const plots = await webview.vegaVisualization$$

      expect(plots.length).toBe(6)
      for (const plot of plots) {
        expect(
          (await plot.$$('[aria-roledescription="rect mark"]').length) +
            (await plot.$$('[aria-roledescription="line mark"]').length)
        ).toBeGreaterThan(0)
      }

      await webview.close()
    })
  })
})
