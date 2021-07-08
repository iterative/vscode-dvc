import { join, resolve } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import { transformExperimentsRepo } from './transformExperimentsRepo'
import { ColumnData, Experiment, TableData } from './webview/contract'
import { buildExperimentSortFunction, SortDefinition } from './sorting'
import { pickSort } from './quickPick'
import { ResourceLocator } from '../resourceLocator'
import { onDidChangeFileSystem } from '../fileSystem/watcher'
import { retryUntilAllResolved } from '../util/promise'
import { AvailableCommands, InternalCommands } from '../internalCommands'
import { ProcessManager } from '../processManager'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

export const EXPERIMENTS_GIT_REFS = join('.git', 'refs', 'exps')

export enum ColumnStatus {
  selected = 2,
  indeterminate = 1,
  unselected = 0
}

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

  private columnStatus: Record<string, ColumnStatus> = {}

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

  public getColumn(path: string) {
    const column = this.columnData?.find(column => column.path === path)
    if (column) {
      return { ...column, isSelected: this.columnStatus[column.path] }
    }
  }

  public getChildColumns(path: string) {
    return this.columnData?.filter(column =>
      path
        ? column.parentPath === path
        : ['metrics', 'params'].includes(column.parentPath)
    )
  }

  public setIsColumnSelected(path: string) {
    const isSelected = this.getNextStatus(path)
    this.columnStatus[path] = isSelected
    this.setAreParentsSelected(path)
    this.setAreChildrenSelected(path, isSelected)
    this.sendData()

    return this.columnStatus[path]
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
    const pickedSortDefinition = await pickSort(this.columnData)
    if (pickedSortDefinition) {
      return this.setSort(pickedSortDefinition)
    }
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
      if (this.columnStatus[column.path] === undefined) {
        this.columnStatus[column.path] = ColumnStatus.selected
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
        this.columnData?.filter(
          column => this.columnStatus[column.path] !== ColumnStatus.unselected
        ) || [],
      rows: this.rowData || []
    }
  }

  private setAreChildrenSelected(path: string, isSelected: ColumnStatus) {
    return this.getChildColumns(path)?.map(column => {
      const path = column.path
      this.columnStatus[path] = isSelected
      this.setAreChildrenSelected(path, isSelected)
    })
  }

  private setAreParentsSelected(path: string) {
    const changedColumn = this.getColumn(path)
    if (!changedColumn) {
      return
    }
    const parent = this.getColumn(changedColumn.parentPath)
    if (!parent) {
      return
    }

    const parentPath = parent.path

    const status = this.getStatusFromChildren(parentPath)
    this.columnStatus[parentPath] = status
    this.setAreParentsSelected(parentPath)
  }

  private getStatusFromChildren(parentPath: string) {
    const statuses = this.getChildStatuses(parentPath)

    const isAnyChildSelected = statuses.includes(ColumnStatus.selected)
    const isAnyChildUnselected = statuses.includes(ColumnStatus.unselected)
    const isAnyChildIndeterminate = statuses.includes(
      ColumnStatus.indeterminate
    )

    if (
      (isAnyChildSelected && isAnyChildUnselected) ||
      isAnyChildIndeterminate
    ) {
      return ColumnStatus.indeterminate
    }

    if (!isAnyChildUnselected) {
      return ColumnStatus.selected
    }

    return ColumnStatus.unselected
  }

  private getChildStatuses(parentPath: string): ColumnStatus[] {
    return (
      this.getChildColumns(parentPath)?.map(
        column => this.columnStatus[column.path]
      ) || []
    )
  }

  private getNextStatus(path: string) {
    const isSelected = this.columnStatus[path]
    if (isSelected === ColumnStatus.selected) {
      return ColumnStatus.unselected
    }
    return ColumnStatus.selected
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
