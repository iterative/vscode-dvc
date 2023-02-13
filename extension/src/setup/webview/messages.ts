import { commands } from 'vscode'
import { SetupData as TSetupData } from './contract'
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
import { RegisteredCommands } from '../../commands/external'

export class WebviewMessages {
  private readonly getWebview: () => BaseWebview<TSetupData> | undefined
  private readonly initializeDvc: () => Promise<void>
  private readonly initializeGit: () => void

  constructor(
    getWebview: () => BaseWebview<TSetupData> | undefined,
    initializeDvc: () => Promise<void>,
    initializeGit: () => void
  ) {
    this.getWebview = getWebview
    this.initializeDvc = initializeDvc
    this.initializeGit = initializeGit
  }

  public sendWebviewMessage({
    cliCompatible,
    needsGitInitialized,
    canGitInitialize,
    needsGitCommit,
    projectInitialized,
    isPythonExtensionInstalled,
    pythonBinPath,
    hasData
  }: {
    cliCompatible: boolean | undefined
    needsGitInitialized: boolean | undefined
    canGitInitialize: boolean
    projectInitialized: boolean
    needsGitCommit: boolean
    isPythonExtensionInstalled: boolean
    pythonBinPath: string | undefined
    hasData: boolean | undefined
  }) {
    void this.getWebview()?.show({
      canGitInitialize,
      cliCompatible,
      hasData,
      isPythonExtensionInstalled,
      needsGitCommit,
      needsGitInitialized,
      projectInitialized,
      pythonBinPath
    })
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.CHECK_CLI_COMPATIBLE:
        return commands.executeCommand(
          RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
        )
      case MessageFromWebviewType.INITIALIZE_DVC:
        return this.initializeDvc()
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
}
