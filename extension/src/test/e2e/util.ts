import { ViewControl } from 'wdio-vscode-service'

const findProgressBars = () => $$('.monaco-progress-container')

export const dismissAllNotifications = () =>
  browser.waitUntil(async () => {
    const workbench = await browser.getWorkbench()
    const notifications = await workbench.getNotifications()
    for (const n of notifications) {
      await n.dismiss()
    }
    const openNotifications = await workbench.getNotifications()
    return openNotifications.length === 0
  })

export const dvcIsWorking = async () => {
  const workbench = await browser.getWorkbench()
  const statusBar = workbench.getStatusBar()
  const statusBarItems = await statusBar.getItems()
  return statusBarItems.some(
    statusBarItem =>
      statusBarItem.includes('loading~spin') && statusBarItem.includes('DVC')
  )
}

export const getDVCActivityBarIcon = async (): Promise<ViewControl> => {
  const workbench = await browser.getWorkbench()

  const activityBar = workbench.getActivityBar()

  await browser.waitUntil(
    async () => !!(await activityBar.getViewControl('DVC'))
  )
  return activityBar.getViewControl('DVC') as Promise<ViewControl>
}

export const waitForViewContainerToLoad = async () => {
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
    if (await dvcIsWorking()) {
      return false
    }

    const numberOfProgressBarsInContainer = 7
    const currentProgressBars = await findProgressBars()

    return !(
      currentProgressBars.length <
      initialProgressBars.length + numberOfProgressBarsInContainer
    )
  })

  const workbench = await browser.getWorkbench()
  await workbench.executeCommand('DVC: Pull')

  return browser.waitUntil(
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

export const closeAllEditors = async () => {
  const workbench = await browser.getWorkbench()
  const editorView = workbench.getEditorView()
  return editorView.closeAllEditors()
}
