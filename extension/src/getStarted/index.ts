import { relative } from 'path'
import { GetStartedData as TGetStartedData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'
import { isSameOrChild } from '../fileSystem'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'
import { findPythonBin } from '../python'

export type GetStartedWebview = BaseWebview<TGetStartedData>

export class GetStarted extends BaseRepository<TGetStartedData> {
  public readonly viewKey = ViewKey.GET_STARTED

  private webviewMessages: WebviewMessages
  private getCliAccessible: () => boolean
  private getHasRoots: () => boolean
  private getIsPythonExtensionUsed: () => boolean
  private getPythonBinPath: () => string | undefined
  private getHasData: () => boolean

  constructor(
    dvcRoot: string,
    webviewIcon: Resource,
    initProject: () => void,
    showExperiments: () => void,
    getCliAccessible: () => boolean,
    getHasRoots: () => boolean,
    getHasData: () => boolean,
    getIsPythonExtensionUsed: () => boolean,
    getPythonBinPath: () => string | undefined,
    installDvc: () => void
  ) {
    super(dvcRoot, webviewIcon)

    this.webviewMessages = this.createWebviewMessageHandler(
      initProject,
      showExperiments,
      installDvc
    )

    if (this.webview) {
      this.sendDataToWebview()
    }
    this.getCliAccessible = getCliAccessible
    this.getHasRoots = getHasRoots
    this.getHasData = getHasData
    this.getIsPythonExtensionUsed = getIsPythonExtensionUsed
    this.getPythonBinPath = getPythonBinPath
  }

  public sendInitialWebviewData() {
    return this.sendDataToWebview()
  }

  public async sendDataToWebview() {
    const pythonBinPath = await this.getPythonBinPathWithDefault()

    this.webviewMessages.sendWebviewMessage(
      this.getCliAccessible(),
      this.getHasRoots(),
      this.getIsPythonExtensionUsed(),
      pythonBinPath,
      this.getHasData()
    )
  }

  private createWebviewMessageHandler(
    initProject: () => void,
    showExperiments: () => void,
    installDvc: () => void
  ) {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      initProject,
      showExperiments,
      installDvc
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }

  private async getPythonBinPathWithDefault() {
    const pythonPath = this.getPythonBinPath()

    if (!pythonPath) {
      return await findPythonBin()
    }

    const firstWorkspaceFolder = getFirstWorkspaceFolder()
    if (!firstWorkspaceFolder) {
      return pythonPath
    }

    return isSameOrChild(firstWorkspaceFolder, pythonPath)
      ? relative(firstWorkspaceFolder, pythonPath)
      : pythonPath
  }
}
