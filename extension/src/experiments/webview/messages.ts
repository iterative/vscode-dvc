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
import { getPositiveIntegerInput } from '../../vscode/inputBox'
import { Title } from '../../vscode/title'
import { ConfigKey, setConfigValue } from '../../vscode/config'
import { NUM_OF_COMMITS_TO_INCREASE } from '../../cli/dvc/constants'
import { Pipeline } from '../../pipeline'

export class WebviewMessages {
  private readonly dvcRoot: string

  private readonly experiments: ExperimentsModel
  private readonly columns: ColumnsModel
  private readonly pipeline: Pipeline

  private readonly getWebview: () => BaseWebview<TableData> | undefined
  private readonly notifyChanged: () => void
  private readonly selectColumns: () => Promise<void>

  private readonly selectBranches: (
    branchesSelected: string[]
  ) => Promise<string[] | undefined>

  private readonly update: () => Promise<void>

  constructor(
    dvcRoot: string,
    experiments: ExperimentsModel,
    columns: ColumnsModel,
    pipeline: Pipeline,
    getWebview: () => BaseWebview<TableData> | undefined,
    notifyChanged: () => void,
    selectColumns: () => Promise<void>,
    selectBranches: (
      branchesSelected: string[]
    ) => Promise<string[] | undefined>,
    update: () => Promise<void>
  ) {
    this.dvcRoot = dvcRoot
    this.experiments = experiments
    this.columns = columns
    this.pipeline = pipeline
    this.getWebview = getWebview
    this.notifyChanged = notifyChanged
    this.selectColumns = selectColumns
    this.selectBranches = selectBranches
    this.update = update
  }

  public sendWebviewMessage() {
    const webview = this.getWebview()
    void webview?.show(this.getWebviewData())
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    // eslint-disable-next-line sonarjs/max-switch-cases
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
      case MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_AND_QUEUE:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_QUEUE,
          { dvcRoot: this.dvcRoot }
        )
      case MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_AND_RUN:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_RUN,
          { dvcRoot: this.dvcRoot }
        )
      case MessageFromWebviewType.MODIFY_WORKSPACE_PARAMS_RESET_AND_RUN:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_RESET_AND_RUN,
          { dvcRoot: this.dvcRoot }
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
        return this.showPlots()

      case MessageFromWebviewType.SET_EXPERIMENTS_FOR_PLOTS:
        return this.setSelectedExperiments(message.payload)

      case MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS:
        return Promise.all([
          this.setSelectedExperiments(message.payload),
          this.showPlots()
        ])

      case MessageFromWebviewType.SET_EXPERIMENTS_HEADER_HEIGHT: {
        return this.setMaxTableHeadDepth()
      }

      case MessageFromWebviewType.STOP_EXPERIMENTS: {
        return commands.executeCommand(
          RegisteredCommands.EXPERIMENT_VIEW_STOP,
          {
            dvcRoot: this.dvcRoot,
            ids: message.payload
          }
        )
      }

      case MessageFromWebviewType.ADD_CONFIGURATION: {
        return this.addConfiguration()
      }
      case MessageFromWebviewType.PUSH_EXPERIMENT:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_PUSH,
          { dvcRoot: this.dvcRoot, ids: message.payload }
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
        return this.changeCommitsToShow(1, message.payload)

      case MessageFromWebviewType.SHOW_LESS_COMMITS:
        return this.changeCommitsToShow(-1, message.payload)
      case MessageFromWebviewType.SELECT_BRANCHES:
        return this.addAndRemoveBranches()

      case MessageFromWebviewType.REFRESH_EXP_DATA:
        return this.refreshData()

      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
  }

  private async addAndRemoveBranches() {
    const selectedBranches = await this.selectBranches(
      this.experiments.getBranchesToShow()
    )
    if (!selectedBranches) {
      return
    }
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_SELECT_BRANCHES,
      undefined,
      undefined
    )
    this.experiments.setSelectedBranches(selectedBranches)
    await this.update()
  }

  private async changeCommitsToShow(change: 1 | -1, branch: string) {
    sendTelemetryEvent(
      change === 1
        ? EventName.VIEWS_EXPERIMENTS_TABLE_SHOW_MORE_COMMITS
        : EventName.VIEWS_EXPERIMENTS_TABLE_SHOW_LESS_COMMITS,
      undefined,
      undefined
    )
    this.experiments.setNbfCommitsToShow(
      this.experiments.getNbOfCommitsToShow(branch) +
        NUM_OF_COMMITS_TO_INCREASE * change,
      branch
    )
    await this.update()
  }

  private refreshData() {
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_REFRESH,
      undefined,
      undefined
    )

    return this.update()
  }

  private getWebviewData(): TableData {
    return {
      changes: this.columns.getChanges(),
      cliError: this.experiments.getCliError() || null,
      columnOrder: this.columns.getColumnOrder(),
      columnWidths: this.columns.getColumnWidths(),
      columns: this.columns.getSelected(),
      filters: this.experiments.getFilterPaths(),
      hasBranchesToSelect:
        this.experiments.getAvailableBranchesToShow().length > 0,
      hasCheckpoints: this.experiments.hasCheckpoints(),
      hasColumns: this.columns.hasNonDefaultColumns(),
      hasConfig: this.pipeline.hasPipeline(),
      hasMoreCommits: this.experiments.getHasMoreCommits(),
      hasRunningWorkspaceExperiment:
        this.experiments.hasRunningWorkspaceExperiment(),
      isShowingMoreCommits: this.experiments.getIsShowingMoreCommits(),
      rows: this.experiments.getRowData(),
      selectedForPlotsCount: this.experiments.getSelectedRevisions().length,
      sorts: this.experiments.getSorts()
    }
  }

  private addConfiguration() {
    return this.pipeline.checkOrAddPipeline()
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

  private showPlots() {
    return commands.executeCommand(RegisteredCommands.PLOTS_SHOW, this.dvcRoot)
  }
}
