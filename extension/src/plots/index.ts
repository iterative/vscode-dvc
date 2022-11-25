import { join } from 'path'
import { Event, EventEmitter, Memento } from 'vscode'
import { PlotsData as TPlotsData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { PlotsData } from './data'
import { PlotsModel } from './model'
import { collectEncodingElements, collectScale } from './paths/collect'
import { PathsModel } from './paths/model'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { definedAndNonEmpty } from '../util/array'
import { ExperimentsOutput } from '../cli/dvc/contract'
import { TEMP_PLOTS_DIR } from '../cli/dvc/constants'
import { removeDir } from '../fileSystem'
import { Toast } from '../vscode/toast'
import { pickPaths } from '../path/selection/quickPick'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  public readonly onDidChangePaths: Event<void>

  private readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

  private readonly experiments: Experiments
  private readonly plots: PlotsModel
  private readonly paths: PathsModel
  private readonly data: PlotsData

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

    this.experiments = experiments

    this.plots = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, workspaceState)
    )
    this.paths = this.dispose.track(
      new PathsModel(this.dvcRoot, workspaceState)
    )

    this.webviewMessages = this.createWebviewMessageHandler(
      this.paths,
      this.plots,
      this.experiments
    )

    this.data = this.dispose.track(
      new PlotsData(dvcRoot, internalCommands, this.plots, updatesPaused)
    )

    this.onDidUpdateData()
    this.waitForInitialData(experiments)

    if (this.webview) {
      this.sendInitialWebviewData()
    }

    this.ensureTempDirRemoved()

    this.onDidChangePaths = this.pathsChanged.event
  }

  public sendInitialWebviewData() {
    return this.fetchMissingOrSendPlots()
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
    Toast.infoWithOptions(
      'Attempting to refresh plots for selected experiments.'
    )
    for (const { revision } of this.plots.getSelectedRevisionDetails()) {
      this.plots.setupManualRefresh(revision)
    }
    this.data.managedUpdate()
  }

  public getChildPaths(path: string | undefined) {
    const multiSourceEncoding = this.plots.getMultiSourceData()

    if (path && multiSourceEncoding[path]) {
      return collectEncodingElements(path, multiSourceEncoding)
    }

    return this.paths.getChildren(path, multiSourceEncoding)
  }

  public getPathStatuses() {
    return this.paths.getTerminalNodeStatuses()
  }

  public getScale() {
    return collectScale(this.paths.getTerminalNodes())
  }

  private notifyChanged() {
    this.pathsChanged.fire()
    this.fetchMissingOrSendPlots()
  }

  private async fetchMissingOrSendPlots() {
    await this.isReady()

    if (
      this.paths.hasPaths() &&
      definedAndNonEmpty(this.plots.getUnfetchedRevisions())
    ) {
      this.webviewMessages.sendCheckpointPlotsMessage()
      return this.data.managedUpdate()
    }

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
          this.setupExperimentsListener(experiments)
          this.initializeData(data)
        }
      })
    )
  }

  private setupExperimentsListener(experiments: Experiments) {
    this.dispose.track(
      experiments.onDidChangeExperiments(async data => {
        if (data) {
          await this.plots.transformAndSetExperiments(data)
        }

        this.plots.setComparisonOrder()

        this.fetchMissingOrSendPlots()
      })
    )
  }

  private async initializeData(data: ExperimentsOutput) {
    await this.plots.transformAndSetExperiments(data)
    this.data.managedUpdate()
    await Promise.all([
      this.data.isReady(),
      this.plots.isReady(),
      this.paths.isReady()
    ])
    this.deferred.resolve()
  }

  private onDidUpdateData() {
    this.dispose.track(
      this.data.onDidUpdate(async ({ data, revs }) => {
        await Promise.all([
          this.plots.transformAndSetPlots(data, revs),
          this.paths.transformAndSet(data)
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
