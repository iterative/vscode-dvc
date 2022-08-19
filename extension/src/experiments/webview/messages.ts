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

export class WebviewMessages {
  private readonly dvcRoot: string

  private readonly experiments: ExperimentsModel
  private readonly columns: ColumnsModel
  private readonly checkpoints: CheckpointsModel

  private readonly getWebview: () => BaseWebview<TableData> | undefined
  private readonly notifyChanged: () => void
  private readonly selectColumns: () => void

  constructor(
    dvcRoot: string,
    experiments: ExperimentsModel,
    columns: ColumnsModel,
    checkpoints: CheckpointsModel,
    getWebview: () => BaseWebview<TableData> | undefined,
    notifyChanged: () => void,
    selectColumns: () => void
  ) {
    this.dvcRoot = dvcRoot
    this.experiments = experiments
    this.columns = columns
    this.checkpoints = checkpoints
    this.getWebview = getWebview
    this.notifyChanged = notifyChanged
    this.selectColumns = selectColumns
  }

  public sendWebviewMessage() {
    const webview = this.getWebview()
    webview?.show(this.getWebviewData())
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
      case MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_QUEUE:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_QUEUE,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )
      case MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_RUN:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_RUN,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )
      case MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_RESET_AND_RUN:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_RESET_AND_RUN,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )

      case MessageFromWebviewType.REMOVE_EXPERIMENT:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_REMOVE,
          { dvcRoot: this.dvcRoot, ids: [message.payload].flat() }
        )
      case MessageFromWebviewType.SELECT_COLUMNS:
        return this.setColumnsStatus()

      case MessageFromWebviewType.FOCUS_FILTERS_TREE:
        return this.focusFiltersTree()
      case MessageFromWebviewType.FOCUS_SORTS_TREE:
        return this.focusSortsTree()

      case MessageFromWebviewType.OPEN_PLOTS_WEBVIEW:
        return commands.executeCommand(RegisteredCommands.PLOTS_SHOW)

      case MessageFromWebviewType.SHARE_EXPERIMENT_AS_BRANCH:
        return commands.executeCommand(
          RegisteredCliCommands.EXPERIMENT_VIEW_SHARE,
          { dvcRoot: this.dvcRoot, id: message.payload }
        )

      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
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
      hasColumns: this.columns.hasColumns(),
      hasRunningExperiment: this.experiments.hasRunningExperiment(),
      rows: this.experiments.getRowData(),
      sorts: this.experiments.getSorts()
    }
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
    this.sendWebviewMessage()
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_EXPERIMENT_STARS_TOGGLE,
      undefined,
      undefined
    )
    return this.notifyChanged()
  }

  private setColumnsStatus() {
    this.selectColumns()
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
    this.columns.toggleStatus(path)

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
}
