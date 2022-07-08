import { ViewControl } from 'wdio-vscode-service'
import { ElementArray } from 'webdriverio'

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

export const getDVCActivityBarIcon = async (): Promise<ViewControl> => {
  const workbench = await browser.getWorkbench()

  const activityBar = workbench.getActivityBar()

  await browser.waitUntil(
    async () => !!(await activityBar.getViewControl('DVC'))
  )
  return activityBar.getViewControl('DVC') as Promise<ViewControl>
}

export const waitForViewContainerToLoad = async () => {
  const initialProgressBars = await $$('.monaco-progress-container')
  await browser.waitUntil(async () => {
    const dvcIcon = await getDVCActivityBarIcon()
    if (!dvcIcon) {
      return false
    }

    const view = await dvcIcon.openView()

    return !!view
  })

  let currentProgressBars: ElementArray

  await browser.waitUntil(async () => {
    const numberOfProgressBarsInContainer = 7
    currentProgressBars = await $$('.monaco-progress-container')

    return !(
      currentProgressBars.length <
      initialProgressBars.length + numberOfProgressBarsInContainer
    )
  })

  const workbench = await browser.getWorkbench()
  await workbench.executeCommand('DVC: Pull')

  return browser.waitUntil(
    async () => {
      for (const progress of currentProgressBars) {
        if ((await progress.getAttribute('aria-hidden')) !== 'true') {
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
