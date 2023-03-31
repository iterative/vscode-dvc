import { commands, Uri, ViewColumn, window } from 'vscode'
import { TableData } from './contract'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { Logger } from '../../common/logger'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { join } from '../../test/util/path'
import { BaseWebview } from '../../webview'
import {
  MessageFromWebview,
  MessageFromWebviewType
} from '../../webview/contract'
import { ColumnsModel } from '../columns/model'
import { splitColumnPath } from '../columns/paths'
import { ExperimentsModel } from '../model'
import { SortDefinition } from '../model/sortBy'
import { CheckpointsModel } from '../checkpoints/model'
import { getPositiveIntegerInput } from '../../vscode/inputBox'
import { Title } from '../../vscode/title'
import { ConfigKey, setConfigValue } from '../../vscode/config'
import { Toast } from '../../vscode/toast'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { stopWorkspaceExperiment } from '../processExecution'
import { hasDvcYamlFile } from '../../fileSystem'
import { NUM_OF_COMMITS_TO_INCREASE } from '../../cli/dvc/constants'

export class WebviewMessages {
  private readonly dvcRoot: string

  private readonly experiments: ExperimentsModel
  private readonly columns: ColumnsModel
  private readonly checkpoints: CheckpointsModel

  private readonly getWebview: () => BaseWebview<TableData> | undefined
  private readonly notifyChanged: () => void
  private readonly selectColumns: () => Promise<void>
  private readonly stopQueuedExperiments: (
    dvcRoot: string,
    ...ids: string[]
  ) => Promise<string | undefined>

  private readonly hasStages: () => Promise<string | undefined>

  private hasConfig = false
  private hasValidDvcYaml = true
  private hasMoreCommits = false
  private isShowingMoreCommits = true

  private readonly addStage: () => Promise<boolean>
  private readonly getNumCommits: () => Promise<number>
  private readonly changeNbOfCommits: () => Promise<void>

  constructor(
    dvcRoot: string,
    experiments: ExperimentsModel,
    columns: ColumnsModel,
    checkpoints: CheckpointsModel,
    getWebview: () => BaseWebview<TableData> | undefined,
    notifyChanged: () => void,
    selectColumns: () => Promise<void>,
    stopQueuedExperiments: (
      dvcRoot: string,
      ...ids: string[]
    ) => Promise<string | undefined>,
    hasStages: () => Promise<string>,
    addStage: () => Promise<boolean>,
    getNumCommits: () => Promise<number>,
    changeNbOfCommits: () => Promise<void>
  ) {
    this.dvcRoot = dvcRoot
    this.experiments = experiments
    this.columns = columns
    this.checkpoints = checkpoints
    this.getWebview = getWebview
    this.notifyChanged = notifyChanged
    this.selectColumns = selectColumns
    this.stopQueuedExperiments = stopQueuedExperiments
    this.hasStages = hasStages
    this.addStage = addStage
    this.getNumCommits = getNumCommits
    this.changeNbOfCommits = changeNbOfCommits

    void this.changeHasConfig()
    void this.changeHasMoreOrLessCommits()
  }

  public async changeHasConfig(update?: boolean) {
    const stages = await this.hasStages()
    this.hasValidDvcYaml = !hasDvcYamlFile(this.dvcRoot) || stages !== undefined
    this.hasConfig = !!stages
    update && this.sendWebviewMessage()
  }

  public sendWebviewMessage() {
    const webview = this.getWebview()
    void webview?.show(this.getWebviewData())
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.REORDER_COLUMNS:
        return this.setColumnOrder(message.payload)
      case MessageFromWebviewType.RESIZE_COLUMN:
        return this.setColumnWidth(message.payload.id, message.payload.width)
      case MessageFromWebviewType.TOGGLE_EXPERIMENT:
        return commands.executeCommand(RegisteredCommands.EXPERIMENT_TOGGLE, {
          dvcRoot: this.dvcRoot,
          id: message.payload
        })
      case MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR:
        return this.setExperimentStars(message.payload)
      case MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN:
        return this.hideTableColumn(message.payload)
      case MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE:
        return this.openParamsFileToTheSide(message.payload)
      case MessageFromWebviewType.SORT_COLUMN:
        return this.addColumnSort(message.payload)
      case MessageFromWebviewType.REMOVE_COLUMN_SORT:
        return this.removeColumnSort(message.payload)
      case MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_APPLY,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )
      case MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )
      case MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_QUEUE,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )
      case MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_RUN:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_RUN,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )
      case MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_RESET_AND_RUN,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )

      case MessageFromWebviewType.REMOVE_EXPERIMENT:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_REMOVE,
          { dvcRoot: this.dvcRoot, ids: [message.payload].flat() }
        )

      case MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER:
        return commands.executeCommand(
          RegisteredCommands.EXPERIMENT_FILTER_ADD_STARRED,
          this.dvcRoot
        )

      case MessageFromWebviewType.SELECT_COLUMNS:
        return this.setColumnsStatus()

      case MessageFromWebviewType.FOCUS_FILTERS_TREE:
        return this.focusFiltersTree()
      case MessageFromWebviewType.FOCUS_SORTS_TREE:
        return this.focusSortsTree()

      case MessageFromWebviewType.OPEN_PLOTS_WEBVIEW:
        return this.showPlotsToSide()

      case MessageFromWebviewType.SHARE_EXPERIMENT_AS_BRANCH:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_SHARE_AS_BRANCH,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )
      case MessageFromWebviewType.SHARE_EXPERIMENT_AS_COMMIT:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_SHARE_AS_COMMIT,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )

      case MessageFromWebviewType.SET_EXPERIMENTS_FOR_PLOTS:
        return this.setSelectedExperiments(message.payload)

      case MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS:
        return Promise.all([
          this.setSelectedExperiments(message.payload),
          this.showPlotsToSide()
        ])

      case MessageFromWebviewType.SET_EXPERIMENTS_HEADER_HEIGHT: {
        return this.setMaxTableHeadDepth()
      }

      case MessageFromWebviewType.STOP_EXPERIMENT: {
        return this.stopExperiments(message.payload)
      }

      case MessageFromWebviewType.ADD_CONFIGURATION: {
        return this.addConfiguration()
      }
      case MessageFromWebviewType.SHARE_EXPERIMENT_TO_STUDIO:
        return commands.executeCommand(
          RegisteredCommands.EXPERIMENT_VIEW_SHARE_TO_STUDIO,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )

      case MessageFromWebviewType.SHOW_EXPERIMENT_LOGS:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_SHOW_LOGS,
          {
            dvcRoot: this.dvcRoot,
            id: message.payload
          }
        )

      case MessageFromWebviewType.SHOW_MORE_COMMITS:
        return this.changeCommitsToShow(1)

      case MessageFromWebviewType.SHOW_LESS_COMMITS:
        return this.changeCommitsToShow(-1)

      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
  }

  private async changeHasMoreOrLessCommits(update?: boolean) {
    const availableNbCommits = await this.getNumCommits()
    const nbOfCommitsToShow = this.experiments.getNbOfCommitsToShow()
    this.hasMoreCommits = availableNbCommits > nbOfCommitsToShow
    this.isShowingMoreCommits =
      Math.min(nbOfCommitsToShow, availableNbCommits) > 1
    update && this.sendWebviewMessage()
  }

  private async changeCommitsToShow(change: 1 | -1) {
    this.experiments.setNbfCommitsToShow(
      this.experiments.getNbOfCommitsToShow() +
        NUM_OF_COMMITS_TO_INCREASE * change
    )
    await this.changeNbOfCommits()
    await this.changeHasMoreOrLessCommits(true)
  }

  private getWebviewData() {
    return {
      changes: this.columns.getChanges(),
      columnOrder: this.columns.getColumnOrder(),
      columnWidths: this.columns.getColumnWidths(),
      columns: this.columns.getSelected(),
      filteredCounts: this.experiments.getFilteredCounts(
        this.checkpoints.hasCheckpoints()
      ),
      filters: this.experiments.getFilterPaths(),
      hasCheckpoints: this.checkpoints.hasCheckpoints(),
      hasColumns: this.columns.hasNonDefaultColumns(),
      hasConfig: this.hasConfig,
      hasMoreCommits: this.hasMoreCommits,
      hasRunningExperiment: this.experiments.hasRunningExperiment(),
      hasValidDvcYaml: this.hasValidDvcYaml,
      isShowingMoreCommits: this.isShowingMoreCommits,
      rows: this.experiments.getRowData(),
      sorts: this.experiments.getSorts()
    }
  }

  private async addConfiguration() {
    await this.addStage()
  }

  private async setMaxTableHeadDepth() {
    const newValue = await getPositiveIntegerInput(
      Title.SET_EXPERIMENTS_HEADER_HEIGHT,
      { prompt: 'Use 0 for infinite height.', value: '0' },
      true
    )

    if (!newValue) {
      return
    }

    void setConfigValue(ConfigKey.EXP_TABLE_HEAD_MAX_HEIGHT, Number(newValue))
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_SET_MAX_HEADER_HEIGHT,
      undefined,
      undefined
    )
  }

  private setColumnOrder(order: string[]) {
    this.columns.setColumnOrder(order)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_COLUMNS_REORDERED,
      undefined,
      undefined
    )
  }

  private setColumnWidth(id: string, width: number) {
    this.columns.setColumnWidth(id, width)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_RESIZE_COLUMN,
      { width },
      undefined
    )
  }

  private setExperimentStars(ids: string[]) {
    this.experiments.toggleStars(ids)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_EXPERIMENT_STARS_TOGGLE,
      undefined,
      undefined
    )
    return this.notifyChanged()
  }

  private setColumnsStatus() {
    void this.selectColumns()
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_SELECT_COLUMNS,
      undefined,
      undefined
    )
  }

  private addColumnSort(sort: SortDefinition) {
    this.experiments.addSort(sort)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_SORT_COLUMN,
      { ...sort },
      undefined
    )
    return this.notifyChanged()
  }

  private removeColumnSort(path: string) {
    this.experiments.removeSort(path)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_REMOVE_COLUMN_SORT,
      { path },
      undefined
    )
    return this.notifyChanged()
  }

  private focusSortsTree() {
    const commandPromise = commands.executeCommand(
      'dvc.views.experimentsSortByTree.focus'
    )
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_SORTS_TREE,
      undefined,
      undefined
    )
    return commandPromise
  }

  private focusFiltersTree() {
    const commandPromise = commands.executeCommand(
      'dvc.views.experimentsFilterByTree.focus'
    )
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_FILTERS_TREE,
      undefined,
      undefined
    )
    return commandPromise
  }

  private hideTableColumn(path: string) {
    this.columns.unselect(path)

    this.notifyChanged()

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_HIDE_COLUMN,
      { path },
      undefined
    )
  }

  private async openParamsFileToTheSide(path: string) {
    const [, fileSegment] = splitColumnPath(path)
    await window.showTextDocument(Uri.file(join(this.dvcRoot, fileSegment)), {
      viewColumn: ViewColumn.Beside
    })
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_OPEN_PARAMS_FILE,
      { path },
      undefined
    )
  }

  private setSelectedExperiments(ids: string[]) {
    const experiments = this.experiments
      .getCombinedList()
      .filter(({ id }) => ids.includes(id))

    this.experiments.setSelected(experiments)

    this.notifyChanged()

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_SELECT_EXPERIMENTS_FOR_PLOTS,
      { experimentCount: ids.length },
      undefined
    )
  }

  private showPlotsToSide() {
    return commands.executeCommand(
      RegisteredCommands.EXPERIMENT_AND_PLOTS_SHOW,
      this.dvcRoot
    )
  }

  private stopExperiments(
    runningExperiments: { id: string; executor?: string | null }[]
  ) {
    const { runningInQueueIds, runningInWorkspace } =
      this.groupRunningExperiments(runningExperiments)

    if (runningInQueueIds.size > 0) {
      void Toast.showOutput(
        this.stopQueuedExperiments(this.dvcRoot, ...runningInQueueIds)
      )
    }
    if (runningInWorkspace) {
      void stopWorkspaceExperiment(this.dvcRoot)
    }

    sendTelemetryEvent(EventName.EXPERIMENT_VIEW_STOP, undefined, undefined)
  }

  private groupRunningExperiments(
    experiments: { executor?: string | null; id: string }[]
  ) {
    let runningInWorkspace = false
    const runningInQueueIds = new Set<string>()
    for (const { executor, id } of experiments) {
      if (executor === EXPERIMENT_WORKSPACE_ID) {
        runningInWorkspace = true
      }
      if (executor === 'dvc-task') {
        runningInQueueIds.add(id)
      }
    }
    return { runningInQueueIds, runningInWorkspace }
  }
}
