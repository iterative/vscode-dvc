import { GetStartedData as TGetStartedData } from './contract'
import { Logger } from '../../common/logger'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from '../../webview/contract'
import { BaseWebview } from '../../webview'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { selectPythonInterpreter } from '../../extensions/python'
import { autoInstallDvc } from '../../cli/dvc/install'

export class WebviewMessages {
  private readonly getWebview: () => BaseWebview<TGetStartedData> | undefined
  private readonly initializeProject: () => void
  private readonly openExperiments: () => void

  constructor(
    getWebview: () => BaseWebview<TGetStartedData> | undefined,
    initializeProject: () => void,
    openExperiments: () => void
  ) {
    this.getWebview = getWebview
    this.initializeProject = initializeProject
    this.openExperiments = openExperiments
  }

  public sendWebviewMessage(
    cliAccessible: boolean,
    projectInitialized: boolean,
    isPythonExtensionUsed: boolean,
    pythonBinPath: string | undefined,
    hasData: boolean
  ) {
    this.getWebview()?.show({
      cliAccessible,
      hasData,
      isPythonExtensionUsed,
      projectInitialized,
      pythonBinPath
    })
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    if (message.type === MessageFromWebviewType.INITIALIZE_PROJECT) {
      return this.initializeProject()
    }
    if (message.type === MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW) {
      this.getWebview()?.dispose()
      return this.openExperiments()
    }

    if (message.type === MessageFromWebviewType.SELECT_PYTHON_INTERPRETER) {
      return this.selectPythonInterpreter()
    }

    if (message.type === MessageFromWebviewType.INSTALL_DVC) {
      return this.installDvc()
    }

    Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
  }

  private selectPythonInterpreter() {
    sendTelemetryEvent(
      EventName.VIEWS_GET_STARTED_SELECT_PYTHON_INTERPRETER,
      undefined,
      undefined
    )
    return selectPythonInterpreter()
  }

  private installDvc() {
    sendTelemetryEvent(
      EventName.VIEWS_GET_STARTED_INSTALL_DVC,
      undefined,
      undefined
    )

    return autoInstallDvc()
  }
}
