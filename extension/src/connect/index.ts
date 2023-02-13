import { commands, workspace } from 'vscode'
import { isStudioAccessToken, validateTokenInput } from './input'
import { STUDIO_URL } from './webview/contract'
import { Resource } from '../resourceLocator'
import { ViewKey } from '../webview/constants'
import { MessageFromWebview, MessageFromWebviewType } from '../webview/contract'
import { BaseRepository } from '../webview/repository'
import { Logger } from '../common/logger'
import { getInput, getValidInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { ConfigKey, getConfigValue, setUserConfigValue } from '../vscode/config'
import { openUrl } from '../vscode/external'
import { ContextKey, setContextValue } from '../vscode/context'

export class Connect extends BaseRepository<undefined> {
  public readonly viewKey = ViewKey.CONNECT

  constructor(webviewIcon: Resource) {
    super('', webviewIcon)

    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        this.handleMessageFromWebview(message)
      )
    )

    void this.setContext()

    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (!e.affectsConfiguration(ConfigKey.STUDIO_ACCESS_TOKEN)) {
          return
        }
        return this.setContext()
      })
    )
  }

  public sendInitialWebviewData(): void {}

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
      validateTokenInput
    )
    if (!token) {
      return
    }

    await setUserConfigValue(ConfigKey.STUDIO_ACCESS_TOKEN, token)
    return commands.executeCommand(
      'workbench.action.openSettings',
      'dvc.studioAccessToken'
    )
  }

  private async setContext() {
    if (
      isStudioAccessToken(await getConfigValue(ConfigKey.STUDIO_ACCESS_TOKEN))
    ) {
      this.webview?.dispose()
      return setContextValue(ContextKey.STUDIO_CONNECTED, true)
    }

    return setContextValue(ContextKey.STUDIO_CONNECTED, false)
  }
}
