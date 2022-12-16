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
  private initProject: () => void
  private showExperiments: () => void
  private getCliAccessible: () => boolean
  private getHasRoots: () => boolean
  private getIsPythonExtensionUsed: () => boolean
  private getPythonBinPath: () => string | undefined

  constructor(
    dvcRoot: string,
    webviewIcon: Resource,
    initProject: () => void,
    showExperiments: () => void,
    getCliAccessible: () => boolean,
    getHasRoots: () => boolean,
    getIsPythonExtensionUsed: () => boolean,
    getPythonBinPath: () => string | undefined
  ) {
    super(dvcRoot, webviewIcon)

    this.webviewMessages = this.createWebviewMessageHandler()

    if (this.webview) {
      this.sendDataToWebview()
    }
    this.getCliAccessible = getCliAccessible
    this.getHasRoots = getHasRoots
    this.initProject = initProject
    this.showExperiments = showExperiments
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
      pythonBinPath
    )
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      () => this.initProject(),
      () => this.showExperiments()
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
