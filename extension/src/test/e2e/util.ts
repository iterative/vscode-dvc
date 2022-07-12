import {
  ChainablePromiseArray,
  ChainablePromiseElement,
  ElementArray
} from 'webdriverio'
import { ViewControl } from 'wdio-vscode-service'

const findProgressBars = (): ChainablePromiseArray<ElementArray> =>
  $$('.monaco-progress-container')

const findCurrentTreeItems = (): ChainablePromiseArray<ElementArray> =>
  $$('div[role="treeitem"]')

export const getLabel = (element: WebdriverIO.Element): Promise<string> =>
  element.getAttribute('aria-label')

export const findDecorationTooltip = (
  element: WebdriverIO.Element
): ChainablePromiseElement<WebdriverIO.Element> =>
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

export const waitForDvcToFinish = async (): Promise<void> => {
  await browser.waitUntil(async () => !(await dvcIsWorking()), {
    timeout: 60000
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

export const closeAllEditors = async (): Promise<void> => {
  const workbench = await browser.getWorkbench()
  const editorView = workbench.getEditorView()
  return editorView.closeAllEditors()
}

export const findScmTreeItems = async () => {
  const workspace = await browser.getWorkbench()
  const activityBar = workspace.getActivityBar()
  const sourceControlIcon = await activityBar.getViewControl('Source Control')

  await sourceControlIcon?.openView()

  return findCurrentTreeItems()
}
