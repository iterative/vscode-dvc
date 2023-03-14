import { commands } from 'vscode'
import { STUDIO_URL, SetupData, SetupData as TSetupData } from './contract'
import { Logger } from '../../common/logger'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from '../../webview/contract'
import { BaseWebview } from '../../webview'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { selectPythonInterpreter } from '../../extensions/python'
import { autoInstallDvc } from '../autoInstall'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { ConfigKey, setConfigValue } from '../../vscode/config'
import { openUrl } from '../../vscode/external'

export class WebviewMessages {
  private readonly getWebview: () => BaseWebview<TSetupData> | undefined
  private readonly initializeGit: () => void

  constructor(
    getWebview: () => BaseWebview<TSetupData> | undefined,
    initializeGit: () => void
  ) {
    this.getWebview = getWebview
    this.initializeGit = initializeGit
  }

  public sendWebviewMessage({
    canGitInitialize,
    cliCompatible,
    hasData,
    isPythonExtensionInstalled,
    isStudioConnected,
    needsGitCommit,
    needsGitInitialized,
    projectInitialized,
    pythonBinPath,
    sectionCollapsed,
    shareLiveToStudio
  }: SetupData) {
    void this.getWebview()?.show({
      canGitInitialize,
      cliCompatible,
      hasData,
      isPythonExtensionInstalled,
      isStudioConnected,
      needsGitCommit,
      needsGitInitialized,
      projectInitialized,
      pythonBinPath,
      sectionCollapsed,
      shareLiveToStudio
    })
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
      case MessageFromWebviewType.SHOW_SCM_PANEL:
        return this.showScmForCommit()
      case MessageFromWebviewType.SELECT_PYTHON_INTERPRETER:
        return this.selectPythonInterpreter()
      case MessageFromWebviewType.INSTALL_DVC:
        return this.installDvc()
      case MessageFromWebviewType.SETUP_WORKSPACE:
        return commands.executeCommand(
          RegisteredCommands.EXTENSION_SETUP_WORKSPACE
        )
      case MessageFromWebviewType.OPEN_STUDIO:
        return this.openStudio()
      case MessageFromWebviewType.OPEN_STUDIO_PROFILE:
        return this.openStudioProfile()
      case MessageFromWebviewType.SAVE_STUDIO_TOKEN:
        return commands.executeCommand(
          RegisteredCommands.ADD_STUDIO_ACCESS_TOKEN
        )
      case MessageFromWebviewType.REMOVE_STUDIO_TOKEN:
        return commands.executeCommand(
          RegisteredCommands.REMOVE_STUDIO_ACCESS_TOKEN
        )
      case MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE:
        return setConfigValue(
          ConfigKey.STUDIO_SHARE_EXPERIMENTS_LIVE,
          message.payload
        )

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

  private selectPythonInterpreter() {
    sendTelemetryEvent(
      EventName.VIEWS_SETUP_SELECT_PYTHON_INTERPRETER,
      undefined,
      undefined
    )
    return selectPythonInterpreter()
  }

  private installDvc() {
    sendTelemetryEvent(EventName.VIEWS_SETUP_INSTALL_DVC, undefined, undefined)

    return autoInstallDvc()
  }

  private openStudio() {
    return openUrl(STUDIO_URL)
  }

  private openStudioProfile() {
    return openUrl(`${STUDIO_URL}/user/_/profile?section=accessToken`)
  }
}
