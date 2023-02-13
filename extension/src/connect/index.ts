import { Uri, env } from 'vscode'
import { Resource } from '../resourceLocator'
import { ViewKey } from '../webview/constants'
import { MessageFromWebview, MessageFromWebviewType } from '../webview/contract'
import { BaseRepository } from '../webview/repository'
import { Logger } from '../common/logger'
import { getInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { ConfigKey, setUserConfigValue } from '../vscode/config'

export class Connect extends BaseRepository<undefined> {
  public readonly viewKey = ViewKey.CONNECT

  constructor(webviewIcon: Resource) {
    super('', webviewIcon)

    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        this.handleMessageFromWebview(message)
      )
    )
  }

  public sendInitialWebviewData(): void {}

  private handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.OPEN_STUDIO_IN_BROWSER:
        return env.openExternal(Uri.parse('https://studio.iterative.ai'))
      case MessageFromWebviewType.OPEN_STUDIO_PROFILE:
        return this.openStudioProfile()
      case MessageFromWebviewType.SAVE_STUDIO_TOKEN:
        return this.saveStudioToken()
      default:
        Logger.error('method not implemented')
    }
  }

  private async openStudioProfile() {
    const username = await getInput(Title.ENTER_STUDIO_USERNAME)
    if (!username) {
      return
    }
    return env.openExternal(
      Uri.parse(`https://studio.iterative.ai/user/${username}/profile`)
    )
  }

  private async saveStudioToken() {
    const token = await getInput(Title.ENTER_STUDIO_TOKEN)
    if (!token) {
      return
    }
    return setUserConfigValue(ConfigKey.STUDIO_ACCESS_TOKEN, token)
  }
}
