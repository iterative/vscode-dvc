import { join } from 'path'
import { Event, EventEmitter, Memento } from 'vscode'
import { PlotsData as TPlotsData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { PlotsData } from './data'
import { ErrorsModel } from './errors/model'
import { DecorationProvider } from './errors/decorationProvider'
import { PlotsModel } from './model'
import { collectEncodingElements, collectScale } from './paths/collect'
import { PathsModel } from './paths/model'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { TEMP_PLOTS_DIR } from '../cli/dvc/constants'
import { removeDir } from '../fileSystem'
import { Toast } from '../vscode/toast'
import { pickPaths } from '../path/selection/quickPick'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  public readonly onDidChangePaths: Event<void>

  private readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

  private readonly plots: PlotsModel
  private readonly paths: PathsModel
  private readonly data: PlotsData

  private readonly errors: ErrorsModel
  private readonly decorationProvider = this.dispose.track(
    new DecorationProvider()
  )

  private webviewMessages: WebviewMessages

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    experiments: Experiments,
    updatesPaused: EventEmitter<boolean>,
    webviewIcon: Resource,
    workspaceState: Memento
  ) {
    super(dvcRoot, webviewIcon)

    this.errors = this.dispose.track(new ErrorsModel(this.dvcRoot))

    this.plots = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.errors, workspaceState)
    )
    this.paths = this.dispose.track(
      new PathsModel(this.dvcRoot, this.errors, workspaceState)
    )

    this.webviewMessages = this.createWebviewMessageHandler(
      this.paths,
      this.plots,
      experiments
    )

    this.data = this.dispose.track(
      new PlotsData(dvcRoot, internalCommands, this.plots, updatesPaused)
    )

    this.onDidTriggerDataUpdate()
    this.onDidUpdateData()
    this.waitForInitialData(experiments)

    if (this.webview) {
      void this.sendInitialWebviewData()
    }

    this.ensureTempDirRemoved()

    this.onDidChangePaths = this.pathsChanged.event
  }

  public togglePathStatus(path: string) {
    const status = this.paths.toggleStatus(path)
    this.paths.setTemplateOrder()
    this.notifyChanged()
    return status
  }

  public async selectPlots() {
    const paths = this.paths.getTerminalNodes()

    const selected = await pickPaths('plots', paths)
    if (!selected) {
      return
    }

    this.paths.setSelected(selected)
    this.paths.setTemplateOrder()
    return this.notifyChanged()
  }

  public refreshPlots() {
    void Toast.infoWithOptions(
      'Attempting to refresh plots for selected experiments.'
    )
    this.triggerDataUpdate()
  }

  public getChildPaths(path: string | undefined) {
    const multiSourceEncoding = this.plots.getMultiSourceData()

    if (path && multiSourceEncoding[path]) {
      return collectEncodingElements(path, multiSourceEncoding)
    }

    return this.paths.getChildren(path, multiSourceEncoding)
  }

  public getPathStatuses() {
    return this.paths.getTerminalNodeStatuses(undefined)
  }

  public getScale() {
    return collectScale(this.paths.getTerminalNodes())
  }

  protected sendInitialWebviewData() {
    return this.sendPlots()
  }

  private notifyChanged() {
    const selectedRevisions = this.plots.getSelectedRevisions()
    this.paths.setSelectedRevisions(selectedRevisions)
    this.decorationProvider.setState(
      this.errors.getErrorPaths(selectedRevisions)
    )
    this.pathsChanged.fire()

    if (this.plots.requiresUpdate()) {
      this.triggerDataUpdate()
      return
    }

    void this.sendPlots()
  }

  private async sendPlots() {
    await this.isReady()

    return this.webviewMessages.sendWebviewMessage()
  }

  private createWebviewMessageHandler(
    paths: PathsModel,
    plots: PlotsModel,
    experiments: Experiments
  ) {
    const webviewMessages = new WebviewMessages(
      paths,
      plots,
      experiments,
      () => this.getWebview(),
      () => this.selectPlots(),
      () => this.data.update()
    )
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        webviewMessages.handleMessageFromWebview(message)
      )
    )
    return webviewMessages
  }

  private waitForInitialData(experiments: Experiments) {
    const waitForInitialExpData = this.dispose.track(
      experiments.onDidChangeExperiments(data => {
        if (data) {
          this.dispose.untrack(waitForInitialExpData)
          waitForInitialExpData.dispose()
          this.data.setMetricFiles(data)
          this.setupExperimentsListener(experiments)
          void this.initializeData()
        }
      })
    )
  }

  private setupExperimentsListener(experiments: Experiments) {
    this.dispose.track(
      experiments.onDidChangeExperiments(async data => {
        if (data) {
          await Promise.all([
            this.plots.transformAndSetExperiments(),
            this.data.setMetricFiles(data)
          ])
        }

        this.notifyChanged()
      })
    )

    this.dispose.track(
      experiments.onDidChangeColumnOrderOrStatus(() => {
        this.notifyChanged()
      })
    )
  }

  private async initializeData() {
    await this.plots.transformAndSetExperiments()
    this.triggerDataUpdate()
    await Promise.all([
      this.data.isReady(),
      this.plots.isReady(),
      this.paths.isReady()
    ])
    this.deferred.resolve()
  }

  private triggerDataUpdate() {
    void this.data.managedUpdate()
  }

  private onDidTriggerDataUpdate() {
    const sendCachedDataToWebview = () => {
      this.plots.resetFetched()
      this.plots.setComparisonOrder()
      return this.sendPlots()
    }
    this.dispose.track(this.data.onDidTrigger(() => sendCachedDataToWebview()))
  }

  private onDidUpdateData() {
    this.dispose.track(
      this.data.onDidUpdate(async ({ data, revs }) => {
        const cliIdToLabel = this.plots.getCLIIdToLabel()
        await Promise.all([
          this.plots.transformAndSetPlots(data, revs),
          this.paths.transformAndSet(data, revs, cliIdToLabel),
          this.errors.transformAndSet(data, revs, cliIdToLabel)
        ])
        this.notifyChanged()
      })
    )
  }

  private ensureTempDirRemoved() {
    this.dispose.track({
      dispose: () => {
        const tempDir = join(this.dvcRoot, TEMP_PLOTS_DIR)
        return removeDir(tempDir)
      }
    })
  }
}
