import { join, resolve } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import { transformExperimentsRepo } from './transformExperimentsRepo'
import { ColumnData, Experiment, TableData } from './webview/contract'
import { ResourceLocator } from '../resourceLocator'
import { onDidChangeFileSystem } from '../fileSystem/watcher'
import { retryUntilAllResolved } from '../util/promise'
import { AvailableCommands, InternalCommands } from '../internalCommands'
import { ProcessManager } from '../processManager'
import { ExperimentsRepoJSONOutput } from '../cli/reader'
import { flatten } from '../util/array'

export const EXPERIMENTS_GIT_REFS = join('.git', 'refs', 'exps')

export enum ColumnStatus {
  selected = 2,
  indeterminate = 1,
  unselected = 0
}

export class ExperimentsTable {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>
  public readonly onDidChangeExperimentsRows: Event<void>
  public readonly onDidChangeExperimentsColumns: Event<void>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private readonly experimentsRowsChanged = new EventEmitter<void>()
  private readonly experimentsColumnsChanged = new EventEmitter<void>()

  private columnData?: ColumnData[]
  private rowData?: Experiment[]
  private queued: string[] = []

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
    this.onDidChangeExperimentsRows = this.experimentsRowsChanged.event
    this.onDidChangeExperimentsColumns = this.experimentsColumnsChanged.event

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
      return {
        ...column,
        descendantMetadata: this.getDescendantMetaData(column),
        status: this.columnStatus[column.path]
      }
    }
  }

  public getChildColumns(path: string) {
    return this.columnData?.filter(column =>
      path
        ? column.parentPath === path
        : ['metrics', 'params'].includes(column.parentPath)
    )
  }

  public toggleColumnStatus(path: string) {
    const status = this.getNextStatus(path)
    this.columnStatus[path] = status
    this.setAreParentsSelected(path)
    this.setAreChildrenSelected(path, status)

    this.notifyColumnsChanged()

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

  public getQueuedExperiments(): string[] {
    return this.queued
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

    const { columns, branches, queued, workspace } =
      transformExperimentsRepo(data)

    columns.forEach(column => {
      if (this.columnStatus[column.path] === undefined) {
        this.columnStatus[column.path] = ColumnStatus.selected
      }
    })

    this.columnData = columns
    this.rowData = [workspace, ...branches]
    this.queued = queued

    return this.notifyChanged()
  }

  private notifyChanged() {
    this.experimentsRowsChanged.fire()
    return this.notifyColumnsChanged()
  }

  private notifyColumnsChanged() {
    this.experimentsColumnsChanged.fire()
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

  private setAreChildrenSelected(path: string, status: ColumnStatus) {
    return this.getChildColumns(path)?.map(column => {
      const path = column.path
      this.columnStatus[path] = status
      this.setAreChildrenSelected(path, status)
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

    const status = this.getStatus(parentPath)
    this.columnStatus[parentPath] = status
    this.setAreParentsSelected(parentPath)
  }

  private getStatus(parentPath: string) {
    const statuses = this.getDescendantsStatuses(parentPath)

    const isAnyChildSelected = statuses.includes(ColumnStatus.selected)
    const isAnyChildUnselected = statuses.includes(ColumnStatus.unselected)

    if (isAnyChildSelected && isAnyChildUnselected) {
      return ColumnStatus.indeterminate
    }

    if (!isAnyChildUnselected) {
      return ColumnStatus.selected
    }

    return ColumnStatus.unselected
  }

  private getDescendantsStatuses(parentPath: string): ColumnStatus[] {
    const nestedStatuses = (this.getChildColumns(parentPath) || []).map(
      column => {
        const descendantsStatuses = column.hasChildren
          ? this.getDescendantsStatuses(column.path)
          : []
        return [this.columnStatus[column.path], ...descendantsStatuses]
      }
    )

    return flatten<ColumnStatus>(nestedStatuses)
  }

  private getNextStatus(path: string) {
    const status = this.columnStatus[path]
    if (status === ColumnStatus.selected) {
      return ColumnStatus.unselected
    }
    return ColumnStatus.selected
  }

  private getDescendantMetaData(column: ColumnData) {
    if (!column.hasChildren) {
      return
    }
    const statuses = this.getDescendantsStatuses(column.path)
    return `${
      statuses.filter(status =>
        [ColumnStatus.selected, ColumnStatus.indeterminate].includes(status)
      ).length
    }/${statuses.length}`
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
