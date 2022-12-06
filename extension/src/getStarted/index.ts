import { GetStartedData as TGetStartedData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'
import { AvailableCommands, InternalCommands } from '../commands/internal'

export type GetStartedWebview = BaseWebview<TGetStartedData>

export class GetStarted extends BaseRepository<TGetStartedData> {
  public readonly viewKey = ViewKey.GET_STARTED

  private internalCommands: InternalCommands
  private webviewMessages: WebviewMessages
  private getCliAccessible: () => boolean
  private getHasRoots: () => boolean

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    webviewIcon: Resource,
    getCliAccessible: () => boolean,
    getHasRoots: () => boolean
  ) {
    super(dvcRoot, webviewIcon)

    this.webviewMessages = this.createWebviewMessageHandler()
    this.internalCommands = internalCommands

    if (this.webview) {
      this.sendDataToWebview()
    }
    this.getCliAccessible = getCliAccessible
    this.getHasRoots = getHasRoots
  }

  public sendInitialWebviewData() {
    return this.sendDataToWebview()
  }

  public sendDataToWebview() {
    this.webviewMessages.sendWebviewMessage(
      this.getCliAccessible(),
      this.getHasRoots()
    )
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      () => this.initializeProject(),
      () => this.openExperimentsWebview()
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }

  private initializeProject() {
    this.internalCommands.executeCommand(AvailableCommands.INIT)
  }

  private openExperimentsWebview() {
    this.internalCommands.executeCommand(AvailableCommands.EXPERIMENT_SHOW)
  }
}
