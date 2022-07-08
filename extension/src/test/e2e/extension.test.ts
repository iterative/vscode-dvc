import { suite, before, describe, it } from 'mocha'
import {
  closeAllEditors,
  dismissAllNotifications,
  getDVCActivityBarIcon,
  waitForDvcToFinish,
  waitForViewContainerToLoad
} from './util'
import { ExperimentsWebview } from './pageObjects/experimentsWebview'
import { PlotsWebview } from './pageObjects/plotsWebview'

suite('DVC Extension For Visual Studio Code', () => {
  before('should finish loading the extension', async function () {
    this.timeout(240000)
    await waitForViewContainerToLoad()
    return dismissAllNotifications()
  })

  after(function () {
    this.timeout(60000)
    return waitForDvcToFinish()
  })

  afterEach(function () {
    return browser.switchToFrame(null)
  })

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
      const epochs = 5
      await workbench.executeCommand('DVC: Reset and Run Experiment')

      await webview.open()

      await browser.waitUntil(() => webview.expandAllRows())

      const initialRows = await webview.row$$

      expect(initialRows.length).toBeGreaterThanOrEqual(4)

      await browser.waitUntil(
        async () => {
          await webview.expandAllRows()
          const currentRows = await webview.row$$
          // eslint-disable-next-line no-console
          console.error(JSON.stringify(currentRows.length))
          return currentRows.length >= initialRows.length + epochs
        },
        { timeout: 180000 }
      )

      const finalRows = await webview.row$$

      expect(finalRows.length).toStrictEqual(initialRows.length + epochs)
      await webview.close()
      await waitForDvcToFinish()
    }).timeout(180000)
  })

  describe('Plots Webview', () => {
    before(async () => {
      await closeAllEditors()
    })

    const webview = new PlotsWebview('plots')

    it('should load the plots webview with non-empty plots', async () => {
      const workbench = await browser.getWorkbench()
      await workbench.executeCommand('DVC: Show Plots')

      await waitForDvcToFinish()

      await webview.open()

      await browser.waitUntil(async () => {
        return (await webview.vegaVisualization$$.length) === 6
      })

      const plots = await webview.vegaVisualization$$

      for (const plot of plots) {
        await plot.scrollIntoView()
        const plotNotEmpty = await webview.plotNotEmpty(plot)
        expect(plotNotEmpty).toBe(true)
      }

      await webview.close()
    })
  })
})
