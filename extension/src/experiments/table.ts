import { join, resolve } from 'path'
import { Event, EventEmitter, window } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import { transformExperimentsRepo } from './transformExperimentsRepo'
import { ColumnData, Experiment, TableData } from './webview/contract'
import { buildExperimentSortFunction, SortDefinition } from './sorting'
import { ResourceLocator } from '../resourceLocator'
import { onDidChangeFileSystem } from '../fileSystem/watcher'
import { retryUntilAllResolved } from '../util/promise'
import { AvailableCommands, InternalCommands } from '../internalCommands'
import { ProcessManager } from '../processManager'
import { ExperimentsRepoJSONOutput } from '../cli/reader'
import { QuickPickItemWithValue, quickPickValue } from '../vscode/quickPick'

export const EXPERIMENTS_GIT_REFS = join('.git', 'refs', 'exps')

export class ExperimentsTable {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private currentSort?: SortDefinition
  private workspace?: Experiment
  private unsortedRows?: Experiment[]
  private sortedRows?: Experiment[]

  private columnData?: ColumnData[]
  private rowData?: Experiment[]

  private isColumnSelected: Record<string, boolean> = {}

  private processManager: ProcessManager

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
    this.resourceLocator = resourceLocator

    this.onDidChangeIsWebviewFocused = this.isWebviewFocusedChanged.event

    this.processManager = this.dispose.track(
      new ProcessManager({ name: 'refresh', process: () => this.updateData() })
    )

    this.refresh().then(() => this.deferred.resolve())
  }

  public isReady() {
    return this.initialized
  }

  public onDidChangeData(gitRoot: string): void {
    const refsPath = resolve(gitRoot, EXPERIMENTS_GIT_REFS)
    this.dispose.track(onDidChangeFileSystem(refsPath, () => this.refresh()))
  }

  public refresh() {
    return this.processManager.run('refresh')
  }

  public getColumns() {
    return this.columnData
  }

  public getIsColumnSelected(path: string) {
    return this.isColumnSelected[path]
  }

  public setIsColumnSelected(path: string) {
    const isSelected = !this.isColumnSelected[path]
    this.isColumnSelected[path] = isSelected
    this.sendData()

    return this.isColumnSelected[path]
  }

  public showWebview = async () => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await ExperimentsWebview.create(
      this.internalCommands,
      {
        dvcRoot: this.dvcRoot,
        tableData: this.getTableData()
      },
      this.resourceLocator
    )

    this.setWebview(webview)

    this.isWebviewFocusedChanged.fire(this.dvcRoot)

    return webview
  }

  public setWebview = (view: ExperimentsWebview) => {
    this.webview = this.dispose.track(view)
    this.sendData()
    this.dispose.track(
      view.onDidDispose(() => {
        this.resetWebview()
      })
    )
    this.dispose.track(
      view.onDidChangeIsFocused(dvcRoot => {
        this.isWebviewFocusedChanged.fire(dvcRoot)
      })
    )
  }

  public setSort(sort: SortDefinition | undefined) {
    this.currentSort = sort
    this.updateRowData()
    this.sendData()
  }

  public async pickSort() {
    if (!this.columnData) {
      window.showWarningMessage('There are no columns to sort from!')
      return
    }
    const columnQuickPickItems: QuickPickItemWithValue<ColumnData>[] =
      this.columnData.map(column => ({
        description: column.path,
        label: column.name,
        value: column
      }))
    if (!columnQuickPickItems || columnQuickPickItems.length === 0) {
      window.showWarningMessage('There are no columns to sort from!')
      return
    }
    const pickedColumn = await quickPickValue<ColumnData>(
      columnQuickPickItems,
      {
        title: 'Select a column to sort'
      }
    )
    if (!pickedColumn) {
      return
    }
    const descending = await quickPickValue<boolean>(
      [
        { label: 'Ascending', value: false },
        { label: 'Descending', value: true }
      ],
      { title: 'Select a direction to sort' }
    )
    if (descending === undefined) {
      return
    }
    this.setSort({
      columnPath: pickedColumn.path.split('/'),
      descending
    })
  }

  private applySorts() {
    if (this.currentSort) {
      const sortFunction = buildExperimentSortFunction(
        this.currentSort as SortDefinition
      )
      this.sortedRows = (this.unsortedRows as Experiment[]).map(branch => {
        if (!branch.subRows) {
          return branch
        }
        const sortedRows = [...branch.subRows].sort(sortFunction)
        return {
          ...branch,
          subRows: sortedRows
        }
      })
    } else {
      this.sortedRows = this.unsortedRows
    }
  }

  private updateRowData(): void {
    this.applySorts()
    const { workspace, sortedRows } = this
    this.rowData = sortedRows
      ? [workspace as Experiment, ...(sortedRows as Experiment[])]
      : [workspace as Experiment]
  }

  private async updateData(): Promise<boolean | undefined> {
    const getNewPromise = () =>
      this.internalCommands.executeCommand<ExperimentsRepoJSONOutput>(
        AvailableCommands.EXPERIMENT_SHOW,
        this.dvcRoot
      )
    const data = await retryUntilAllResolved<ExperimentsRepoJSONOutput>(
      getNewPromise,
      'Experiments table update'
    )

    const { columns, branches, workspace } = transformExperimentsRepo(data)

    columns.forEach(column => {
      if (this.isColumnSelected[column.path] === undefined) {
        this.isColumnSelected[column.path] = true
      }
    })

    this.columnData = columns
    this.workspace = workspace
    this.unsortedRows = branches

    this.updateRowData()

    return this.sendData()
  }

  private async sendData() {
    if (this.webview) {
      await this.webview.isReady()
      return this.webview.showExperiments({
        tableData: this.getTableData()
      })
    }
  }

  private getTableData(): TableData {
    return {
      columns:
        this.columnData?.filter(column => this.isColumnSelected[column.path]) ||
        [],
      rows: this.rowData || []
    }
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
