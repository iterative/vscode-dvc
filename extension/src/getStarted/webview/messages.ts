import { GetStartedData as TGetStartedData } from './contract'
import { Logger } from '../../common/logger'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from '../../webview/contract'
import { BaseWebview } from '../../webview'

export class WebviewMessages {
  private readonly getWebview: () => BaseWebview<TGetStartedData> | undefined
  private readonly initializeProject: () => void

  constructor(
    getWebview: () => BaseWebview<TGetStartedData> | undefined,
    initializeProject: () => void
  ) {
    this.getWebview = getWebview
    this.initializeProject = initializeProject
  }

  public sendWebviewMessage(
    cliAccessible: boolean,
    projectInitialized: boolean,
    hasData: boolean
  ) {
    this.getWebview()?.show({
      cliAccessible,
      hasData,
      projectInitialized
    })
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    if (message.type === MessageFromWebviewType.INITIALIZE_PROJECT) {
      return this.initializeProject()
    }
    Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
  }
}
