import { SetupData as TSetupData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { findPythonBinForInstall } from './autoInstall'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Resource } from '../resourceLocator'
import { isPythonExtensionInstalled } from '../extensions/python'
import { getBinDisplayText } from '../fileSystem'

export type SetupWebviewWebview = BaseWebview<TSetupData>

export class Setup extends BaseRepository<TSetupData> {
  public readonly viewKey = ViewKey.SETUP

  private readonly webviewMessages: WebviewMessages
  private readonly showExperiments: () => void
  private readonly getCliCompatible: () => boolean | undefined
  private readonly needsGitInit: () => Promise<boolean | undefined>
  private readonly canGitInitialize: (needsGitInit: boolean) => Promise<boolean>
  private readonly getHasRoots: () => boolean
  private readonly getHasData: () => boolean | undefined

  constructor(
    dvcRoot: string,
    webviewIcon: Resource,
    initializeDvc: () => void,
    initializeGit: () => void,
    showExperiments: () => void,
    getCliCompatible: () => boolean | undefined,
    needsGitInit: () => Promise<boolean | undefined>,
    canGitInitialize: (needsGitInit: boolean) => Promise<boolean>,
    getHasRoots: () => boolean,
    getHasData: () => boolean | undefined
  ) {
    super(dvcRoot, webviewIcon)

    this.webviewMessages = this.createWebviewMessageHandler(
      initializeDvc,
      initializeGit
    )

    if (this.webview) {
      this.sendDataToWebview()
    }
    this.showExperiments = showExperiments
    this.getCliCompatible = getCliCompatible
    this.needsGitInit = needsGitInit
    this.canGitInitialize = canGitInitialize
    this.getHasRoots = getHasRoots
    this.getHasData = getHasData
  }

  public isFocused() {
    return !!this.webview?.isActive
  }

  public sendInitialWebviewData() {
    return this.sendDataToWebview()
  }

  public async sendDataToWebview() {
    const cliCompatible = this.getCliCompatible()
    const projectInitialized = this.getHasRoots()
    const hasData = this.getHasData()

    if (
      this.webview?.isVisible &&
      cliCompatible &&
      projectInitialized &&
      hasData
    ) {
      this.getWebview()?.dispose()
      this.showExperiments()
      return
    }

    const needsGitInitialized =
      !projectInitialized && !!(await this.needsGitInit())

    const canGitInitialize = await this.canGitInitialize(needsGitInitialized)

    const pythonBinPath = await findPythonBinForInstall()

    this.webviewMessages.sendWebviewMessage(
      cliCompatible,
      needsGitInitialized,
      canGitInitialize,
      projectInitialized,
      isPythonExtensionInstalled(),
      getBinDisplayText(pythonBinPath),
      hasData
    )
  }

  private createWebviewMessageHandler(
    initializeDvc: () => void,
    initGit: () => void
  ) {
    const webviewMessages = new WebviewMessages(
      () => this.getWebview(),
      initializeDvc,
      initGit
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }
}
