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
import { collectColumnsWithChangedValues } from '../columns/collect'
import { ColumnLike } from '../columns/like'
import { getFilterId } from '../model/filterBy'

export class WebviewMessages {
  private readonly dvcRoot: string

  private readonly experiments: ExperimentsModel
  private readonly columns: ColumnsModel
  private readonly pipeline: Pipeline

  private readonly getWebview: () => BaseWebview<TableData> | undefined
  private readonly notifyChanged: () => void
  private readonly selectColumns: () => Promise<void>
  private readonly selectFirstColumns: () => Promise<void>
  private readonly addFilter: (column: ColumnLike) => Promise<void>
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
    selectFirstColumns: () => Promise<void>,
    selectBranches: (
      branchesSelected: string[]
    ) => Promise<string[] | undefined>,
    addFilter: (column: ColumnLike) => Promise<void>,
    update: () => Promise<void>
  ) {
    this.dvcRoot = dvcRoot
    this.experiments = experiments
    this.columns = columns
    this.pipeline = pipeline
    this.getWebview = getWebview
    this.notifyChanged = notifyChanged
    this.selectColumns = selectColumns
    this.selectFirstColumns = selectFirstColumns
    this.selectBranches = selectBranches
    this.addFilter = addFilter
    this.update = update
  }

  public async sendWebviewMessage() {
    const webview = this.getWebview()
    if (!webview) {
      return
    }
    const data = await this.getWebviewData()
    return webview.show(data)
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
      case MessageFromWebviewType.EXPERIMENTS_TABLE_HIDE_COLUMN_PATH:
        return this.hideColumnPath(message.payload)
      case MessageFromWebviewType.EXPERIMENTS_TABLE_MOVE_TO_START:
        return this.movePathToStart(message.payload)
      case MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE:
        return this.openParamsFileToTheSide(message.payload)
      case MessageFromWebviewType.SORT_COLUMN:
        return this.addColumnSort(message.payload)
      case MessageFromWebviewType.REMOVE_COLUMN_SORT:
        return this.removeColumnSort(message.payload)
      case MessageFromWebviewType.FILTER_COLUMN:
        return this.addColumnFilter(message.payload)
      case MessageFromWebviewType.REMOVE_COLUMN_FILTERS:
        return this.removeColumnFilter(message.payload)

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
      case MessageFromWebviewType.REDIRECT_TO_SETUP:
        return this.redirectToSetup()

      case MessageFromWebviewType.SELECT_COLUMNS:
        return this.setColumnsStatus()
      case MessageFromWebviewType.SELECT_FIRST_COLUMNS:
        return this.setFirstColumns()

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
      case MessageFromWebviewType.RESET_COMMITS:
        return this.resetCommitsToShow(message.payload)

      case MessageFromWebviewType.SELECT_BRANCHES:
        return this.addAndRemoveBranches()

      case MessageFromWebviewType.REFRESH_EXP_DATA:
        return this.refreshData()

      case MessageFromWebviewType.TOGGLE_SHOW_ONLY_CHANGED:
        return this.toggleShowOnlyChanged()

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
    this.experiments.setNbfCommitsToShow(
      this.experiments.getNbOfCommitsToShow(branch) +
        NUM_OF_COMMITS_TO_INCREASE * change,
      branch
    )
    await this.update()
    sendTelemetryEvent(
      change === 1
        ? EventName.VIEWS_EXPERIMENTS_TABLE_SHOW_MORE_COMMITS
        : EventName.VIEWS_EXPERIMENTS_TABLE_SHOW_LESS_COMMITS,
      undefined,
      undefined
    )
  }

  private async resetCommitsToShow(branch: string) {
    this.experiments.resetNbfCommitsToShow(branch)
    await this.update()
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_RESET_COMMITS,
      undefined,
      undefined
    )
  }

  private async redirectToSetup() {
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_REDIRECT_TO_SETUP,
      undefined,
      undefined
    )

    await commands.executeCommand(RegisteredCommands.SETUP_SHOW_EXPERIMENTS)

    const webview = this.getWebview()
    webview?.dispose()
  }

  private refreshData() {
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_REFRESH,
      undefined,
      undefined
    )

    return this.update()
  }

  private toggleShowOnlyChanged() {
    this.columns.toggleShowOnlyChanged()
    return Promise.all([
      this.sendWebviewMessage(),
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_TABLE_REFRESH,
        undefined,
        undefined
      )
    ])
  }

  private async getWebviewData(): Promise<TableData> {
    const [
      changes,
      cliError,
      columnOrder,
      columnWidths,
      selectedColumns,
      filters,
      hasBranchesToSelect,
      hasCheckpoints,
      hasColumns,
      hasConfig,
      hasMoreCommits,
      hasRunningWorkspaceExperiment,
      isShowingMoreCommits,
      rows,
      selectedBranches,
      selectedForPlotsCount,
      showOnlyChanged,
      sorts
    ] = await Promise.all([
      this.columns.getChanges(),
      this.experiments.getCliError() || null,
      this.columns.getColumnOrder(),
      this.columns.getColumnWidths(),
      this.columns.getSelected(),
      this.experiments.getFilters(),
      this.experiments.getAvailableBranchesToShow().length > 0,
      this.experiments.hasCheckpoints(),
      this.columns.hasNonDefaultColumns(),
      this.pipeline.hasPipeline(),
      this.experiments.getHasMoreCommits(),
      this.experiments.hasRunningWorkspaceExperiment(),
      this.experiments.getIsShowingMoreCommits(),
      this.experiments.getRowData(),
      this.experiments.getSelectedBranches(),
      this.experiments.getSelectedRevisions().length,
      this.columns.getShowOnlyChanged(),
      this.experiments.getSorts()
    ])

    const columns = showOnlyChanged
      ? collectColumnsWithChangedValues(selectedColumns, rows, filters)
      : selectedColumns

    return {
      changes,
      cliError,
      columnOrder,
      columnWidths,
      columns,
      filters: filters.map(({ path }) => path),
      hasBranchesToSelect,
      hasCheckpoints,
      hasColumns,
      hasConfig,
      hasMoreCommits,
      hasRunningWorkspaceExperiment,
      isShowingMoreCommits,
      rows,
      selectedBranches,
      selectedForPlotsCount,
      showOnlyChanged,
      sorts
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

  private setFirstColumns() {
    void this.selectFirstColumns()
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

  private addColumnFilter(selectedPath: string) {
    const column = this.columns
      .getTerminalNodes()
      .find(({ path }) => path === selectedPath)

    if (!column) {
      return
    }

    void this.addFilter(column)

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_FILTER_COLUMN,
      undefined,
      undefined
    )
  }

  private removeColumnFilter(selectedPath: string) {
    for (const filter of this.experiments.getFilters()) {
      if (filter.path === selectedPath) {
        const id = getFilterId(filter)
        this.experiments.removeFilter(id)
      }
    }
    this.notifyChanged()

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_REMOVE_COLUMN_FILTER,
      undefined,
      undefined
    )
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

  private hideColumnPath(path: string) {
    this.columns.unselect(path)

    this.notifyChanged()

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_HIDE_COLUMN_PATH,
      { path },
      undefined
    )
  }

  private movePathToStart(path: string) {
    const toMove = []
    const terminalNodes = this.columns.getColumnOrder()
    for (const terminalNode of terminalNodes) {
      if (!terminalNode.startsWith(path)) {
        continue
      }
      toMove.push(terminalNode)
    }

    this.columns.selectFirst(toMove)

    this.notifyChanged()

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_MOVE_TO_START,
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
