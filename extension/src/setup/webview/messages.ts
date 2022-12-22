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
  private readonly initializeProject: () => void

  constructor(
    getWebview: () => BaseWebview<TSetupData> | undefined,
    initializeProject: () => void
  ) {
    this.getWebview = getWebview
    this.initializeProject = initializeProject
  }

  public sendWebviewMessage(
    cliAccessible: boolean,
    projectInitialized: boolean,
    isPythonExtensionInstalled: boolean,
    pythonBinPath: string | undefined,
    hasData: boolean | undefined
  ) {
    this.getWebview()?.show({
      cliAccessible,
      hasData,
      isPythonExtensionInstalled,
      projectInitialized,
      pythonBinPath
    })
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    if (message.type === MessageFromWebviewType.INITIALIZE_PROJECT) {
      return this.initializeProject()
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
