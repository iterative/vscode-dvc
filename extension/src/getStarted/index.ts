import { GetStartedData as TGetStartedData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { findPythonBinForInstall, getPythonBinDisplayText } from './autoInstall'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'
import { isPythonExtensionInstalled } from '../extensions/python'

export type GetStartedWebview = BaseWebview<TGetStartedData>

export class GetStarted extends BaseRepository<TGetStartedData> {
  public readonly viewKey = ViewKey.GET_STARTED

  private webviewMessages: WebviewMessages
  private getCliAccessible: () => boolean
  private showExperiments: () => void

  private getHasRoots: () => boolean
  private getHasData: () => boolean

  constructor(
    dvcRoot: string,
    webviewIcon: Resource,
    initProject: () => void,
    showExperiments: () => void,
    getCliAccessible: () => boolean,
    getHasRoots: () => boolean,
    getHasData: () => boolean
  ) {
    super(dvcRoot, webviewIcon)

    this.webviewMessages = this.createWebviewMessageHandler(initProject)

    if (this.webview) {
      this.sendDataToWebview()
    }
    this.showExperiments = showExperiments
    this.getCliAccessible = getCliAccessible
    this.getHasRoots = getHasRoots
    this.getHasData = getHasData
  }

  public sendInitialWebviewData() {
    return this.sendDataToWebview()
  }

  public sendDataToWebview() {
    const cliAccessible = this.getCliAccessible()
    const projectInitialized = this.getHasRoots()
    const hasData = this.getHasData()

    if (
      this.webview?.isVisible &&
      cliAccessible &&
      projectInitialized &&
      hasData
    ) {
      this.getWebview()?.dispose()
      this.showExperiments()
      return
    }

    const pythonBinPath = await findPythonBinForInstall()

    this.webviewMessages.sendWebviewMessage(
      cliAccessible,
      projectInitialized,
      isPythonExtensionInstalled(),
      getPythonBinDisplayText(pythonBinPath),
      hasData
    )
  }

  private createWebviewMessageHandler(initProject: () => void) {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      initProject
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }
}
