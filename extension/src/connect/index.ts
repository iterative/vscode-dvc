import { ExtensionContext, SecretStorage } from 'vscode'
import { validateTokenInput } from './inputBox'
import { isStudioAccessToken } from './token'
import { STUDIO_URL } from './webview/contract'
import { Resource } from '../resourceLocator'
import { ViewKey } from '../webview/constants'
import { MessageFromWebview, MessageFromWebviewType } from '../webview/contract'
import { BaseRepository } from '../webview/repository'
import { Logger } from '../common/logger'
import { getInput, getValidInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { openUrl } from '../vscode/external'
import { ContextKey, setContextValue } from '../vscode/context'

const STUDIO_ACCESS_TOKEN = 'dvc.studioAccessToken'

export class Connect extends BaseRepository<undefined> {
  public readonly viewKey = ViewKey.CONNECT

  private readonly secrets: SecretStorage

  constructor(context: ExtensionContext, webviewIcon: Resource) {
    super('', webviewIcon)

    this.secrets = context.secrets

    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        this.handleMessageFromWebview(message)
      )
    )

    void this.setContext()

    this.dispose.track(
      this.secrets.onDidChange(e => {
        if (e.key !== STUDIO_ACCESS_TOKEN) {
          return
        }
        return this.setContext()
      })
    )
  }

  public sendInitialWebviewData(): void {}

  public removeStudioAccessToken() {
    return this.secrets.delete(STUDIO_ACCESS_TOKEN)
  }

  private handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.OPEN_STUDIO:
        return openUrl(STUDIO_URL)
      case MessageFromWebviewType.OPEN_STUDIO_PROFILE:
        return this.openStudioProfile()
      case MessageFromWebviewType.SAVE_STUDIO_TOKEN:
        return this.saveStudioToken()
      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
  }

  private async openStudioProfile() {
    const username = await getInput(Title.ENTER_STUDIO_USERNAME)
    if (!username) {
      return
    }
    return openUrl(`${STUDIO_URL}/user/${username}/profile`)
  }

  private async saveStudioToken() {
    const token = await getValidInput(
      Title.ENTER_STUDIO_TOKEN,
      validateTokenInput,
      { password: true }
    )
    if (!token) {
      return
    }

    return this.secrets.store(STUDIO_ACCESS_TOKEN, token)
  }

  private async setContext() {
    const storedToken = await this.secrets.get(STUDIO_ACCESS_TOKEN)
    if (isStudioAccessToken(storedToken)) {
      this.webview?.dispose()
      return setContextValue(ContextKey.STUDIO_CONNECTED, true)
    }

    return setContextValue(ContextKey.STUDIO_CONNECTED, false)
  }
}
