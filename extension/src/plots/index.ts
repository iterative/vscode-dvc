import { join } from 'path'
import { Event, EventEmitter, Memento } from 'vscode'
import { PlotsData as TPlotsData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { PlotsData } from './data'
import { PlotsModel } from './model'
import { collectScale } from './paths/collect'
import { PathsModel } from './paths/model'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { definedAndNonEmpty } from '../util/array'
import { ExperimentsOutput, TEMP_PLOTS_DIR } from '../cli/reader'
import { removeDir } from '../fileSystem'
import { Toast } from '../vscode/toast'
import { pickPaths } from '../path/selection/quickPick'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  public readonly onDidChangePaths: Event<void>

  private readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

  private experiments?: Experiments

  private plots?: PlotsModel
  private paths?: PathsModel

  private readonly data: PlotsData
  private readonly workspaceState: Memento

  private webviewMessages?: WebviewMessages

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    webviewIcon: Resource,
    workspaceState: Memento,
    data?: PlotsData
  ) {
    super(dvcRoot, webviewIcon)

    this.data = this.dispose.track(
      data || new PlotsData(dvcRoot, internalCommands, updatesPaused)
    )

    this.dispose.track(
      this.data.onDidUpdate(async ({ data, revs }) => {
        await Promise.all([
          this.plots?.transformAndSetPlots(data, revs),
          this.paths?.transformAndSet(data)
        ])
        this.notifyChanged()
      })
    )

    this.ensureTempDirRemoved()

    this.workspaceState = workspaceState

    this.onDidChangePaths = this.pathsChanged.event
  }

  public setExperiments(experiments: Experiments) {
    this.experiments = experiments

    this.plots = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.workspaceState)
    )
    this.paths = this.dispose.track(
      new PathsModel(this.dvcRoot, this.workspaceState)
    )

    this.webviewMessages = this.createWebviewMessageHandler(
      this.paths,
      this.plots,
      this.experiments
    )

    this.data.setModel(this.plots)

    this.waitForInitialData(experiments)

    if (this.webview) {
      this.sendInitialWebviewData()
    }
  }

  public sendInitialWebviewData() {
    return this.fetchMissingOrSendPlots()
  }

  public togglePathStatus(path: string) {
    const status = this.paths?.toggleStatus(path)
    this.paths?.setTemplateOrder()
    this.notifyChanged()
    return status
  }

  public async selectPlots() {
    const paths = this.paths?.getTerminalNodes()

    const selected = await pickPaths('plots', paths)
    if (!selected) {
      return
    }

    this.paths?.setSelected(selected)
    this.paths?.setTemplateOrder()
    return this.notifyChanged()
  }

  public refreshPlots() {
    Toast.infoWithOptions(
      'Attempting to refresh plots for selected experiments.'
    )
    for (const { revision } of this.plots?.getSelectedRevisionDetails() || []) {
      this.plots?.setupManualRefresh(revision)
    }
    this.data.managedUpdate()
  }

  public getChildPaths(path: string) {
    return this.paths?.getChildren(path) || []
  }

  public getPathStatuses() {
    return this.paths?.getTerminalNodeStatuses() || []
  }

  public getScale() {
    return collectScale(this.paths?.getTerminalNodes())
  }

  private notifyChanged() {
    this.pathsChanged.fire()
    this.fetchMissingOrSendPlots()
  }

  private async fetchMissingOrSendPlots() {
    await this.isReady()

    if (
      this.paths?.hasPaths() &&
      definedAndNonEmpty(this.plots?.getUnfetchedRevisions())
    ) {
      this.webviewMessages?.sendCheckpointPlotsMessage()
      return this.data.managedUpdate()
    }

    return this.webviewMessages?.sendWebviewMessage()
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
          await this.plots?.transformAndSetExperiments(data)
        }

        this.plots?.setComparisonOrder()

        this.fetchMissingOrSendPlots()
      })
    )
  }

  private async initializeData(data: ExperimentsOutput) {
    await this.plots?.transformAndSetExperiments(data)
    this.data.managedUpdate()
    await Promise.all([
      this.data.isReady(),
      this.plots?.isReady(),
      this.paths?.isReady()
    ])
    this.deferred.resolve()
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
