import { commands, ExtensionContext, SecretStorage } from 'vscode'
import { validateTokenInput } from './inputBox'
import { STUDIO_ACCESS_TOKEN_KEY, isStudioAccessToken } from './token'
import { STUDIO_URL } from './webview/contract'
import { Resource } from '../resourceLocator'
import { ViewKey } from '../webview/constants'
import { MessageFromWebview, MessageFromWebviewType } from '../webview/contract'
import { BaseRepository } from '../webview/repository'
import { Logger } from '../common/logger'
import { getValidInput } from '../vscode/inputBox'
import { Title } from '../vscode/title'
import { openUrl } from '../vscode/external'
import { ContextKey, setContextValue } from '../vscode/context'
import { RegisteredCommands } from '../commands/external'
import { Modal } from '../vscode/modal'
import { GLOBAL_WEBVIEW_DVCROOT } from '../webview/factory'
import { ConfigKey, getConfigValue } from '../vscode/config'

export class Connect extends BaseRepository<undefined> {
  public readonly viewKey = ViewKey.CONNECT

  private readonly secrets: SecretStorage
  private studioAccessToken: string | undefined = undefined

  constructor(context: ExtensionContext, webviewIcon: Resource) {
    super(GLOBAL_WEBVIEW_DVCROOT, webviewIcon)

    this.secrets = context.secrets

    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        this.handleMessageFromWebview(message)
      )
    )

    void this.getSecret(STUDIO_ACCESS_TOKEN_KEY).then(
      async studioAccessToken => {
        this.studioAccessToken = studioAccessToken
        await this.setContext()
        this.deferred.resolve()
      }
    )

    this.dispose.track(
      context.secrets.onDidChange(async e => {
        if (e.key !== STUDIO_ACCESS_TOKEN_KEY) {
          return
        }
        this.studioAccessToken = await this.getSecret(STUDIO_ACCESS_TOKEN_KEY)
        return this.setContext()
      })
    )
  }

  public sendInitialWebviewData(): void {}

  public removeStudioAccessToken() {
    return this.removeSecret(STUDIO_ACCESS_TOKEN_KEY)
  }

  public async saveStudioAccessToken() {
    const token = await getValidInput(
      Title.ENTER_STUDIO_TOKEN,
      validateTokenInput,
      { password: true }
    )
    if (!token) {
      return
    }

    return this.storeSecret(STUDIO_ACCESS_TOKEN_KEY, token)
  }

  public getStudioLiveShareToken() {
    return getConfigValue<boolean>(
      ConfigKey.STUDIO_SHARE_EXPERIMENTS_LIVE,
      false
    )
      ? this.getStudioAccessToken()
      : undefined
  }

  public getStudioAccessToken() {
    return this.studioAccessToken
  }

  private handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.OPEN_STUDIO:
        return this.openStudio()
      case MessageFromWebviewType.OPEN_STUDIO_PROFILE:
        return this.openStudioProfile()
      case MessageFromWebviewType.SAVE_STUDIO_TOKEN:
        return commands.executeCommand(
          RegisteredCommands.ADD_STUDIO_ACCESS_TOKEN
        )
      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
  }

  private openStudio() {
    return openUrl(STUDIO_URL)
  }

  private openStudioProfile() {
    return openUrl(`${STUDIO_URL}/user/_/profile?section=accessToken`)
  }

  private setContext() {
    const storedToken = this.getStudioAccessToken()
    if (isStudioAccessToken(storedToken)) {
      if (this.deferred.state === 'resolved') {
        void Modal.showInformation(
          'Studio is now connected. Use the "Share to Studio" command from an experiment\'s context menu to share experiments.'
        )
      }
      this.webview?.dispose()
      return setContextValue(ContextKey.STUDIO_CONNECTED, true)
    }

    return setContextValue(ContextKey.STUDIO_CONNECTED, false)
  }

  private getSecret(key: string) {
    const secrets = this.getSecrets()
    return secrets.get(key)
  }

  private storeSecret(key: string, value: string) {
    const secrets = this.getSecrets()
    return secrets.store(key, value)
  }

  private removeSecret(key: string) {
    const secrets = this.getSecrets()
    return secrets.delete(key)
  }

  private getSecrets() {
    return this.secrets
  }
}
