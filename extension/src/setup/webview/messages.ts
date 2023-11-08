import { commands } from 'vscode'
import { SetupData, SetupData as TSetupData } from './contract'
import { Logger } from '../../common/logger'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from '../../webview/contract'
import { BaseWebview } from '../../webview'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { autoInstallDvc, autoUpgradeDvc } from '../autoInstall'

export class WebviewMessages {
  private readonly getWebview: () => BaseWebview<TSetupData> | undefined
  private readonly initializeGit: () => void
  private readonly updateStudioOffline: (offline: boolean) => Promise<void>
  private readonly isPythonExtensionUsed: () => Promise<boolean>
  private readonly updatePythonEnv: () => Promise<void>
  private readonly requestToken: () => Promise<void>

  constructor(
    getWebview: () => BaseWebview<TSetupData> | undefined,
    initializeGit: () => void,
    updateStudioOffline: (shareLive: boolean) => Promise<void>,
    isPythonExtensionUsed: () => Promise<boolean>,
    updatePythonEnv: () => Promise<void>,
    requestStudioToken: () => Promise<void>
  ) {
    this.getWebview = getWebview
    this.initializeGit = initializeGit
    this.updateStudioOffline = updateStudioOffline
    this.isPythonExtensionUsed = isPythonExtensionUsed
    this.updatePythonEnv = updatePythonEnv
    this.requestToken = requestStudioToken
  }

  public sendWebviewMessage(data: SetupData) {
    void this.getWebview()?.show(data)
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.CHECK_CLI_COMPATIBLE:
        return commands.executeCommand(
          RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
        )
      case MessageFromWebviewType.INITIALIZE_DVC:
        return commands.executeCommand(RegisteredCliCommands.INIT)
      case MessageFromWebviewType.INITIALIZE_GIT:
        return this.gitInit()
      case MessageFromWebviewType.SHOW_WALKTHROUGH:
        return commands.executeCommand(RegisteredCommands.EXTENSION_GET_STARTED)
      case MessageFromWebviewType.SHOW_SCM_PANEL:
        return this.showScmForCommit()
      case MessageFromWebviewType.UPDATE_PYTHON_ENVIRONMENT:
        return this.updatePythonEnvironment()
      case MessageFromWebviewType.INSTALL_DVC:
        return this.installDvc()
      case MessageFromWebviewType.UPGRADE_DVC:
        return this.upgradeDvc()
      case MessageFromWebviewType.SETUP_WORKSPACE:
        return commands.executeCommand(
          RegisteredCommands.EXTENSION_SETUP_WORKSPACE
        )
      case MessageFromWebviewType.SAVE_STUDIO_TOKEN:
        return commands.executeCommand(
          RegisteredCommands.ADD_STUDIO_ACCESS_TOKEN
        )
      case MessageFromWebviewType.REMOVE_STUDIO_TOKEN:
        return commands.executeCommand(
          RegisteredCommands.REMOVE_STUDIO_ACCESS_TOKEN
        )
      case MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE:
        return this.updateStudioOffline(message.payload)
      case MessageFromWebviewType.REQUEST_STUDIO_TOKEN:
        return this.requestStudioToken()
      case MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW:
        return commands.executeCommand(RegisteredCommands.EXPERIMENT_SHOW)
      case MessageFromWebviewType.REMOTE_ADD:
        return commands.executeCommand(RegisteredCliCommands.REMOTE_ADD)
      case MessageFromWebviewType.REMOTE_MODIFY:
        return commands.executeCommand(RegisteredCliCommands.REMOTE_MODIFY)
      case MessageFromWebviewType.REMOTE_REMOVE:
        return commands.executeCommand(RegisteredCliCommands.REMOTE_REMOVE)

      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
  }

  private gitInit() {
    sendTelemetryEvent(EventName.VIEWS_SETUP_INIT_GIT, undefined, undefined)
    return this.initializeGit()
  }

  private showScmForCommit() {
    sendTelemetryEvent(
      EventName.VIEWS_SETUP_SHOW_SCM_FOR_COMMIT,
      undefined,
      undefined
    )
    return commands.executeCommand('workbench.view.scm')
  }

  private updatePythonEnvironment() {
    sendTelemetryEvent(
      EventName.VIEWS_SETUP_UPDATE_PYTHON_ENVIRONMENT,
      undefined,
      undefined
    )
    return this.updatePythonEnv()
  }

  private async upgradeDvc() {
    sendTelemetryEvent(EventName.VIEWS_SETUP_UPGRADE_DVC, undefined, undefined)

    const isPythonExtensionUsed = await this.isPythonExtensionUsed()

    return autoUpgradeDvc(isPythonExtensionUsed)
  }

  private async installDvc() {
    sendTelemetryEvent(EventName.VIEWS_SETUP_INSTALL_DVC, undefined, undefined)

    const isPythonExtensionUsed = await this.isPythonExtensionUsed()

    return autoInstallDvc(isPythonExtensionUsed)
  }

  private requestStudioToken() {
    sendTelemetryEvent(
      EventName.VIEWS_SETUP_REQUEST_STUDIO_TOKEN,
      undefined,
      undefined
    )
    return this.requestToken()
  }
}
