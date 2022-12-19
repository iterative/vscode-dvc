import { GetStartedData as TGetStartedData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'

export type GetStartedWebview = BaseWebview<TGetStartedData>

export class GetStarted extends BaseRepository<TGetStartedData> {
  public readonly viewKey = ViewKey.GET_STARTED

  private webviewMessages: WebviewMessages
  private initProject: () => void
  private showExperiments: () => void
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

    this.webviewMessages = this.createWebviewMessageHandler()

    if (this.webview) {
      this.sendDataToWebview()
    }
    this.getCliAccessible = getCliAccessible
    this.getHasRoots = getHasRoots
    this.initProject = initProject
    this.showExperiments = showExperiments
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

    this.webviewMessages.sendWebviewMessage(
      cliAccessible,
      projectInitialized,
      hasData
    )
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      () => this.initProject()
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }
}
