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
  private readonly initializeDvc: () => void
  private readonly initializeGit: () => void

  constructor(
    getWebview: () => BaseWebview<TSetupData> | undefined,
    initializeDvc: () => void,
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
    this.getWebview()?.show({
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
    if (message.type === MessageFromWebviewType.INITIALIZE_DVC) {
      return this.initializeDvc()
    }

    if (message.type === MessageFromWebviewType.INITIALIZE_GIT) {
      return this.initializeGit()
    }

    if (message.type === MessageFromWebviewType.SELECT_PYTHON_INTERPRETER) {
      return this.selectPythonInterpreter()
    }

    if (message.type === MessageFromWebviewType.INSTALL_DVC) {
      return this.installDvc()
    }

    if (message.type === MessageFromWebviewType.SETUP_WORKSPACE) {
      return commands.executeCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE
      )
    }

    Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
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
