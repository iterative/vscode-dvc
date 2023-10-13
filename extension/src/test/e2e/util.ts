import { Key } from 'webdriverio'
import { $$, browser } from '@wdio/globals'
import { ViewControl, Workbench } from 'wdio-vscode-service'
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
    for (const notification of notifications) {
      await notification.dismiss()
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

const notificationShown = async (
  workbench: Workbench,
  message: string
): Promise<boolean> => {
  const notifications = await workbench.getNotifications()
  for (const notif of notifications) {
    const notifMessage = await notif.elem.getText()
    if (message === notifMessage) {
      return true
    }
  }
  return false
}

const runDeleteCommand = async (
  command: string,
  nothingToDeleteMessage: string
): Promise<void> => {
  const workbench = await browser.getWorkbench()
  const commandPalette = await workbench.executeCommand(command)

  let nothingToDelete = false

  await browser.waitUntil(async () => {
    if (await notificationShown(workbench, nothingToDeleteMessage)) {
      nothingToDelete = true
      return true
    }

    return commandPalette.elem.isDisplayed()
  })

  if (nothingToDelete) {
    return
  }
  await browser
    .action('key')
    .down(Key.Shift)
    .down(Key.Tab)
    .up(Key.Tab)
    .up(Key.Shift)
    .perform()

  await browser.keys('Space')

  return browser.keys('Enter')
}

export const waitForDvcToFinish = async (timeout = 60000): Promise<void> => {
  await browser.waitUntil(async () => !(await dvcIsWorking()), {
    timeout,
    timeoutMsg: `DVC is still working after ${timeout}ms`
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

export const deleteAllExistingExperiments = (): Promise<void> =>
  runDeleteCommand(
    'DVC: Remove Experiment(s)',
    'There are no experiments to select.'
  )

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

  const nonCachedParam = `0.00${Date.now()}`

  await browser.keys([...nonCachedParam, 'Enter'])
  return workbench.executeCommand('DVC: Show Experiments')
}

export const closeAllEditors = async (): Promise<void> => {
  const workbench = await browser.getWorkbench()
  const editorView = workbench.getEditorView()
  return editorView.closeAllEditors()
}

export const createCustomPlot = async (): Promise<void> => {
  const workbench = await browser.getWorkbench()
  const addCustomPlot = await workbench.executeCommand('DVC: Add Plot')
  await browser.waitUntil(() => addCustomPlot.elem.isDisplayed())
  await browser.keys(['ArrowDown', 'Enter'])
  await browser.waitUntil(() => addCustomPlot.elem.isDisplayed())
  await browser.keys('Enter')
  await browser.waitUntil(() => addCustomPlot.elem.isDisplayed())
  return browser.keys('Enter')
}

export const deleteCustomPlots = (): Promise<void> =>
  runDeleteCommand(
    'DVC: Remove Custom Plot(s)',
    'There are no plots to remove.'
  )

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
  const workbench = await browser.getWorkbench()
  const activityBar = workbench.getActivityBar()
  const sourceControlIcon = await activityBar.getViewControl('Source Control')

  await sourceControlIcon?.openView()

  const visibleItems = await findCurrentTreeItems()

  await visibleItems[visibleItems.length - 1].click()

  for (let i = 0; i < 20; i++) {
    await browser.keys('ArrowDown')
  }

  return findCurrentTreeItems()
}
