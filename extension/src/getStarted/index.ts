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

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    webviewIcon: Resource
  ) {
    super(dvcRoot, webviewIcon)

    if (this.webview) {
      this.sendInitialWebviewData()
    }

    this.createWebviewMessageHandler()
    this.internalCommands = internalCommands
  }

  public sendInitialWebviewData() {
    return undefined
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      () => this.initializeProject()
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
}
