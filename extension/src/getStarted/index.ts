import { GetStartedData as TGetStartedData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'
import { isPythonExtensionInstalled } from '../extensions/python'
import {
  findPythonBinForInstall,
  getPythonBinDisplayText
} from '../cli/dvc/install'

export type GetStartedWebview = BaseWebview<TGetStartedData>

export class GetStarted extends BaseRepository<TGetStartedData> {
  public readonly viewKey = ViewKey.GET_STARTED

  private webviewMessages: WebviewMessages
  private getCliAccessible: () => boolean
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

    this.webviewMessages = this.createWebviewMessageHandler(
      initProject,
      showExperiments
    )

    if (this.webview) {
      this.sendDataToWebview()
    }
    this.getCliAccessible = getCliAccessible
    this.getHasRoots = getHasRoots
    this.getHasData = getHasData
  }

  public sendInitialWebviewData() {
    return this.sendDataToWebview()
  }

  public async sendDataToWebview() {
    const pythonBinPath = await findPythonBinForInstall()

    this.webviewMessages.sendWebviewMessage(
      this.getCliAccessible(),
      this.getHasRoots(),
      isPythonExtensionInstalled(),
      getPythonBinDisplayText(pythonBinPath),
      this.getHasData()
    )
  }

  private createWebviewMessageHandler(
    initProject: () => void,
    showExperiments: () => void
  ) {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      initProject,
      showExperiments
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }
}
