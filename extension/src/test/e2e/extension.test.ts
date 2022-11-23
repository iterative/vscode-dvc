import { join } from 'path'
import { suite, before, describe, it } from 'mocha'
import {
  closeAllEditors,
  deleteAllExistingExperiments,
  dismissAllNotifications,
  findDecorationTooltip,
  findScmTreeItems,
  getDVCActivityBarIcon,
  getLabel,
  runModifiedExperiment,
  waitForDvcToFinish,
  waitForViewContainerToLoad
} from './util'
import { ExperimentsWebview } from './pageObjects/experimentsWebview'
import { PlotsWebview } from './pageObjects/plotsWebview'

suite('DVC Extension For Visual Studio Code', () => {
  before('should finish loading the extension', async function () {
    this.timeout(240000)
    await waitForViewContainerToLoad()
    await deleteAllExistingExperiments()
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

      await webview.focus()

      await browser.waitUntil(async () => {
        const table = await webview.table$
        return table.isDisplayed()
      })

      expect(await webview.table$$).toHaveLength(1)

      await webview.unfocus()
    })

    it('should update with a new row for each checkpoint when an experiment is running', async () => {
      const epochs = 15
      const headerRows = 3
      const workspaceRow = 1
      const commitRows = 3
      const initialRows = headerRows + workspaceRow + commitRows

      await webview.focus()
      await browser.waitUntil(
        async () => {
          await webview.expandAllRows()
          const currentRows = await webview.row$$
          return currentRows.length === initialRows
        },
        { interval: 5000, timeout: 30000 }
      )

      await webview.unfocus()
      await runModifiedExperiment()
      await webview.focus()

      await browser.waitUntil(
        async () => {
          await webview.expandAllRows()
          const currentRows = await webview.row$$
          return currentRows.length >= initialRows + epochs
        },
        { interval: 5000, timeout: 180000 }
      )

      await webview.unfocus()
      await waitForDvcToFinish()
      await webview.focus()

      const finalRows = await webview.row$$

      expect(finalRows.length).toStrictEqual(initialRows + epochs)
      await webview.unfocus()
      await waitForDvcToFinish()
      const workbench = await browser.getWorkbench()
      await workbench.executeCommand('Terminal: Kill All Terminals')
    }).timeout(180000)
  })

  describe('Plots Webview', () => {
    before(async () => {
      await closeAllEditors()
    })

    const webview = new PlotsWebview('plots')

    it('should load the plots webview with non-empty plots', async () => {
      const workbench = await browser.getWorkbench()
      await workbench.openCommandPrompt()
      await browser.keys([...'DVC: Show Plots', 'ArrowDown', 'Enter'])

      await waitForDvcToFinish()

      await webview.focus()

      await browser.waitUntil(
        async () => {
          return (await webview.vegaVisualization$$.length) === 12
        },
        { timeout: 30000 }
      )

      const plots = await webview.vegaVisualization$$

      for (const plot of plots) {
        await plot.scrollIntoView()
        const plotNotEmpty = await webview.plotNotEmpty(plot)
        expect(plotNotEmpty).toBe(true)
      }

      await webview.unfocus()
    }).timeout(60000)
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Source Control View', () => {
    it('should show the expected changes after running an experiment', async () => {
      const expectedScmItemLabels = [
        'demo DVC',
        'hist.csv',
        'model.pt',
        'plots, training',
        `images, ${join('training', 'plots')}`,
        `metrics, ${join('training', 'plots')}`,
        `sklearn, ${join('training', 'plots')}`,
        `test, ${join('training', 'plots', 'metrics')}`,
        `train, ${join('training', 'plots', 'metrics')}`,
        `misclassified.jpg, ${join('training', 'plots', 'images')}`,
        `acc.tsv, ${join('training', 'plots', 'metrics', 'test')}`,
        `loss.tsv, ${join('training', 'plots', 'metrics', 'test')}`,
        `acc.tsv, ${join('training', 'plots', 'metrics', 'train')}`,
        `loss.tsv, ${join('training', 'plots', 'metrics', 'train')}`,
        `confusion_matrix.json, ${join('training', 'plots', 'sklearn')}`
      ]
      const expectedScmSet = new Set(expectedScmItemLabels)
      let dvcTreeItemLabels: string[] = []

      await browser.waitUntil(
        async () => {
          dvcTreeItemLabels = []
          const treeItems = await findScmTreeItems()
          for (const treeItem of treeItems) {
            const treeItemLabel = await getLabel(treeItem)
            if (!expectedScmSet.has(treeItemLabel)) {
              continue
            }
            dvcTreeItemLabels.push(treeItemLabel)
            if (treeItemLabel === 'demo DVC') {
              continue
            }

            const tooltip = await findDecorationTooltip(treeItem)
            expect(tooltip).toBeTruthy()
          }
          return expectedScmItemLabels.length === dvcTreeItemLabels.length
        },
        {
          interval: 5000,
          timeout: 60000
        }
      )

      expect(expectedScmItemLabels.sort()).toStrictEqual(
        dvcTreeItemLabels.sort()
      )
    })
  })
})
