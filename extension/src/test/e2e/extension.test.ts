import { join } from 'path'
import { browser } from '@wdio/globals'
import {
  closeAllEditors,
  createCustomPlot,
  deleteAllExistingExperiments,
  deleteCustomPlots,
  dismissAllNotifications,
  expectAllPlotsToBeFilled,
  findDecorationTooltip,
  findScmTreeItems,
  getDVCActivityBarIcon,
  getLabel,
  runModifiedExperiment,
  waitForAllPlotsToRender,
  waitForDvcToFinish,
  waitForViewContainerToLoad
} from './util.js'
import { ExperimentsWebview } from './pageObjects/experimentsWebview.js'
import { PlotsWebview } from './pageObjects/plotsWebview.js'

before('should finish loading the extension', async function () {
  this.timeout(240000)
  await waitForViewContainerToLoad()
  await deleteAllExistingExperiments()
  return dismissAllNotifications()
})

after(async function () {
  this.timeout(60000)

  await deleteCustomPlots()
  await dismissAllNotifications()

  return waitForDvcToFinish()
})

describe('Activity Bar', function () {
  it('should show the DVC Icon', async function () {
    const dvcIcon = await getDVCActivityBarIcon()
    expect(await dvcIcon.getTitle()).toBe('DVC')
  })
})

describe('Experiments Table Webview', function () {
  const webview = new ExperimentsWebview('experiments')

  const epochs = 15
  const experimentRow = 1
  const headerRows = 3
  const workspaceRow = 1
  const commitRows = 3
  const branchRow = 1
  const initialRows = headerRows + workspaceRow + commitRows + branchRow

  it('should load as an editor', async function () {
    const workbench = await browser.getWorkbench()

    await workbench.executeCommand('DVC: Show Experiments')

    await webview.focus()

    await browser.waitUntil(async () => {
      const table = await webview.table$
      return table.isDisplayed()
    })

    expect(await webview.table$$).toHaveLength(1)

    return webview.unfocus()
  })

  it('should show the correct number of records before running an experiment', async function () {
    await webview.focus()
    await browser.waitUntil(
      async () => {
        await webview.expandAllRows()
        const currentRows = await webview.row$$
        return currentRows.length === initialRows
      },
      { interval: 5000, timeout: 30000 }
    )

    const currentRows = await webview.row$$
    expect(currentRows.length).toStrictEqual(initialRows)

    await webview.unfocus()

    return closeAllEditors()
  })

  it('should update with new data for each DVCLive step when an experiment is running', async function () {
    this.timeout(210000)
    await runModifiedExperiment()
    await webview.focus()

    await browser.waitUntil(
      async () => {
        await webview.expandAllRows()
        const currentRows = await webview.row$$

        return currentRows.length >= initialRows + experimentRow
      },
      { interval: 5000, timeout: 210000 }
    )

    const currentRows = await webview.row$$

    const newRow = currentRows[headerRows + workspaceRow + branchRow + 1]

    const experimentName = (await webview.getExperimentName(newRow)) as string

    expect(typeof experimentName).toStrictEqual('string')

    await browser.waitUntil(
      async () => {
        await webview.expandAllRows()

        const step = await webview.getExperimentStep(newRow, experimentName)

        return step === epochs - 1
      },
      { interval: 5000, timeout: 210000 }
    )

    const finalRows = await webview.row$$

    expect(finalRows.length).toStrictEqual(initialRows + experimentRow)
    await webview.unfocus()
    await closeAllEditors()
    await waitForDvcToFinish(120000)
    const workbench = await browser.getWorkbench()
    return workbench.executeCommand('Terminal: Kill All Terminals')
  })
})

describe('Plots Webview', function () {
  const webview = new PlotsWebview('plots')

  // eslint-disable-next-line jest/expect-expect
  it('should load the plots webview with non-empty plots', async function () {
    this.timeout(60000)
    const workbench = await browser.getWorkbench()
    await workbench.openCommandPrompt()
    await browser.keys([...'DVC: Show Plots', 'ArrowDown', 'Enter'])

    await waitForDvcToFinish()
    await webview.focus()

    await waitForAllPlotsToRender(webview, 5)

    await expectAllPlotsToBeFilled(webview)

    await webview.unfocus()
    await closeAllEditors()
  })

  // eslint-disable-next-line jest/expect-expect
  it('should create and delete a custom plot', async function () {
    this.timeout(60000)
    await createCustomPlot()
    const workbench = await browser.getWorkbench()
    await workbench.openCommandPrompt()
    await workbench.executeCommand('DVC: Show Plots')

    await waitForDvcToFinish()
    await webview.focus()

    await waitForAllPlotsToRender(webview, 6)

    await expectAllPlotsToBeFilled(webview)

    await webview.unfocus()
    await closeAllEditors()

    await deleteCustomPlots()
    await workbench.executeCommand('DVC: Show Plots')

    await waitForDvcToFinish()
    await webview.focus()

    await waitForAllPlotsToRender(webview, 5)

    await expectAllPlotsToBeFilled(webview)

    await webview.unfocus()
    await closeAllEditors()
  })
})

describe('Source Control View', function () {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  it('should show the expected changes after running an experiment', async function () {
    const expectedScmItemLabels = [
      'hist.csv',
      'model.pt',
      'plots, training',
      `images, ${join('training', 'plots')}`,
      `metrics, ${join('training', 'plots')}`,
      `sklearn, ${join('training', 'plots')}`,
      `test, ${join('training', 'plots', 'metrics')}`,
      `train, ${join('training', 'plots', 'metrics')}`,
      `acc.tsv, ${join('training', 'plots', 'metrics', 'test')}`,
      `loss.tsv, ${join('training', 'plots', 'metrics', 'test')}`,
      `acc.tsv, ${join('training', 'plots', 'metrics', 'train')}`,
      `loss.tsv, ${join('training', 'plots', 'metrics', 'train')}`,
      `confusion_matrix.json, ${join('training', 'plots', 'sklearn')}`
    ]
    for (let i = 0; i < 15; i++) {
      expectedScmItemLabels.push(
        `${i}.jpg, ${join('training', 'plots', 'images', 'misclassified')}`
      )
    }

    const expectedScmSet = new Set(expectedScmItemLabels)
    let dvcTreeItemLabels: string[] = []

    let openView = true

    await browser.waitUntil(
      async () => {
        dvcTreeItemLabels = []
        const treeItems = await findScmTreeItems(openView)
        openView = false
        for (const treeItem of treeItems) {
          const treeItemLabel = await getLabel(treeItem)
          if (!expectedScmSet.has(treeItemLabel)) {
            continue
          }
          dvcTreeItemLabels.push(treeItemLabel)

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

    expectedScmItemLabels.sort()
    dvcTreeItemLabels.sort()
    expect(expectedScmItemLabels).toStrictEqual(dvcTreeItemLabels)
  })
})
