import { Key } from 'webdriverio'
import { $$, browser } from '@wdio/globals'
import { ViewControl } from 'wdio-vscode-service'
import { PlotsWebview } from './pageObjects/plotsWebview.js'

const findProgressBars = () => $$('.monaco-progress-container')

const findCurrentTreeItems = () => $$('div[role="treeitem"]')

export const getLabel = (element: WebdriverIO.Element): Promise<string> =>
  element.getAttribute('aria-label')

export const findDecorationTooltip = (element: WebdriverIO.Element) =>
  element.$('div[title*="• DVC modified"]')

export const dismissAllNotifications = async (): Promise<void> => {
  await browser.waitUntil(async () => {
    const workbench = await browser.getWorkbench()
    const notifications = await workbench.getNotifications()
    for (const n of notifications) {
      await n.dismiss()
    }
    const openNotifications = await workbench.getNotifications()
    return openNotifications.length === 0
  })
}

const dvcIsWorking = async (): Promise<boolean> => {
  const workbench = await browser.getWorkbench()
  const statusBar = workbench.getStatusBar()
  const statusBarItems = await statusBar.getItems()
  return statusBarItems.some(
    statusBarItem =>
      statusBarItem.includes('loading~spin') && statusBarItem.includes('DVC')
  )
}

export const waitForDvcToFinish = async (timeout = 60000): Promise<void> => {
  await browser.waitUntil(async () => !(await dvcIsWorking()), {
    timeout
  })
}

export const getDVCActivityBarIcon = async (): Promise<ViewControl> => {
  const workbench = await browser.getWorkbench()

  const activityBar = workbench.getActivityBar()

  await browser.waitUntil(
    async () => !!(await activityBar.getViewControl('DVC'))
  )
  return activityBar.getViewControl('DVC') as Promise<ViewControl>
}

export const waitForViewContainerToLoad = async (): Promise<void> => {
  const initialProgressBars = await findProgressBars()
  await browser.waitUntil(async () => {
    const dvcIcon = await getDVCActivityBarIcon()
    if (!dvcIcon) {
      return false
    }

    const view = await dvcIcon.openView()

    return !!view
  })

  await browser.waitUntil(async () => {
    const numberOfProgressBarsInContainer = 7
    const currentProgressBars = await findProgressBars()

    return !(
      currentProgressBars.length <
      initialProgressBars.length + numberOfProgressBarsInContainer
    )
  })

  await waitForDvcToFinish()

  const workbench = await browser.getWorkbench()
  await workbench.executeCommand('DVC: Pull')

  await browser.waitUntil(
    async () => {
      if (await dvcIsWorking()) {
        return false
      }

      const currentProgressBars = await findProgressBars()

      for (const progress of currentProgressBars) {
        if (await progress.isDisplayed()) {
          return false
        }
      }

      return true
    },
    { timeout: 180000 }
  )
}

export const deleteAllExistingExperiments = async () => {
  const workbench = await browser.getWorkbench()

  const deleteNonWorkspaceExperiments = await workbench.executeCommand(
    'DVC: Garbage Collect Experiments'
  )
  await browser.waitUntil(() =>
    deleteNonWorkspaceExperiments.elem.isDisplayed()
  )
  await browser.keys('Enter')

  const deleteAllNonTagExperiments = await workbench.executeCommand(
    'DVC: Garbage Collect Experiments'
  )

  await browser.waitUntil(() => deleteAllNonTagExperiments.elem.isDisplayed())

  const tagOption = 'tags'
  await browser.keys([...tagOption, 'ArrowDown', 'Space', 'ArrowUp'])
  for (let i = 0; i < tagOption.length; i++) {
    await browser.keys('Backspace')
  }
  await browser.keys(['w', 'o', 'ArrowDown', 'Space'])
  return browser.keys('Enter')
}

export const runModifiedExperiment = async () => {
  const workbench = await browser.getWorkbench()
  const options = await workbench.executeCommand(
    'DVC: Modify Workspace Param(s) and Run'
  )
  await browser.waitUntil(() => options.elem.isDisplayed())
  await browser
    .action('key')
    .down(Key.ArrowDown)
    .up(Key.ArrowDown)
    .down(Key.Space)
    .up(Key.Space)
    .down(Key.Enter)
    .up(Key.Enter)
    .pause(100)
    .perform()
  await browser.keys([...'0.005', 'Enter'])
  return workbench.executeCommand('DVC: Show Experiments')
}

export const closeAllEditors = async (): Promise<void> => {
  const workbench = await browser.getWorkbench()
  const editorView = workbench.getEditorView()
  return editorView.closeAllEditors()
}

export const createCustomPlot = async (): Promise<void> => {
  const workbench = await browser.getWorkbench()
  const addCustomPlot = await workbench.executeCommand('DVC: Add Custom Plot')
  await browser.waitUntil(() => addCustomPlot.elem.isDisplayed())
  await browser.keys('Enter')
  await browser.waitUntil(() => addCustomPlot.elem.isDisplayed())
  return browser.keys('Enter')
}

export const deleteCustomPlot = async (): Promise<void> => {
  const workbench = await browser.getWorkbench()
  const removeCustomPlot = await workbench.executeCommand(
    'DVC: Remove Custom Plot(s)'
  )
  await browser.waitUntil(() => removeCustomPlot.elem.isDisplayed())
  await browser.keys('ArrowDown')
  await browser.keys('Space')
  return browser.keys('Enter')
}

export const waitForAllPlotsToRender = (
  webview: PlotsWebview,
  plotsAmount: number
): Promise<true | void> => {
  return browser.waitUntil(
    async () => {
      return (await webview.vegaVisualization$$.length) === plotsAmount
    },
    { timeout: 30000 }
  )
}

export const expectAllPlotsToBeFilled = async (webview: PlotsWebview) => {
  const plots = await webview.vegaVisualization$$
  for (const plot of plots) {
    const plotNotEmpty = await webview.plotNotEmpty(plot)
    expect(plotNotEmpty).toBe(true)
  }
}

export const findScmTreeItems = async () => {
  const workspace = await browser.getWorkbench()
  const activityBar = workspace.getActivityBar()
  const sourceControlIcon = await activityBar.getViewControl('Source Control')

  await sourceControlIcon?.openView()

  return findCurrentTreeItems()
}
