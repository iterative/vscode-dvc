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

  public sendWebviewMessage(
    cliCompatible: boolean | undefined,
    needsGitInitialized: boolean | undefined,
    canGitInitialize: boolean,
    projectInitialized: boolean,
    isPythonExtensionInstalled: boolean,
    pythonBinPath: string | undefined,
    hasData: boolean | undefined
  ) {
    void this.getWebview()?.show({
      canGitInitialize,
      cliCompatible,
      hasData,
      isPythonExtensionInstalled,
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
        return this.initializeGit()
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
