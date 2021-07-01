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

const quickPickItemFromColumn = (cur: ColumnData) => ({
  label: cur.path.join('.'),
  value: cur.path
})

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

  private tableData?: TableData

  private columns?: ColumnData[]
  private workspace?: Experiment
  private unsortedRows?: Experiment[]
  private sortedRows?: Experiment[]

  private processManager: ProcessManager

  private currentSort?: SortDefinition

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

  public showWebview = async () => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await ExperimentsWebview.create(
      this.internalCommands,
      {
        dvcRoot: this.dvcRoot,
        tableData: this.tableData
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

  public setCurrentSort(sort: SortDefinition | undefined) {
    this.currentSort = sort
    this.updateTableData()
  }

  public async pickCurrentSort() {
    const columnsToPick = this.columns?.reduce<
      QuickPickItemWithValue<string[]>[]
    >((acc, cur) => {
      const entry: QuickPickItemWithValue<string[]> =
        quickPickItemFromColumn(cur)

      return [...acc, entry]
    }, [])
    if (!columnsToPick || columnsToPick.length === 0) {
      window.showWarningMessage('There are no columns to sort from!')
      return
    }
    const columnPath = await quickPickValue<string[]>(columnsToPick, {
      title: 'Select a column to sort'
    })
    if (!columnPath) {
      return
    }
    const descending = await quickPickValue<boolean>(
      [
        { label: 'Ascending', value: false },
        { label: 'Descending', value: true }
      ],
      { title: 'Select a direction to sort' }
    )
    if (!descending) {
      return
    }
    return this.setCurrentSort({
      columnPath,
      descending
    })
  }

  private updateSortedRows() {
    if (this.currentSort) {
      const sortFunction = buildExperimentSortFunction(
        this.currentSort as SortDefinition
      )
      this.sortedRows = (this.unsortedRows as Experiment[]).map(branch => {
        if (!branch.subRows) {
          return branch
        }
        const sortedExperiments = [...branch.subRows].sort(sortFunction)
        return {
          ...branch,
          subRows: sortedExperiments
        }
      })
    } else {
      this.sortedRows = this.unsortedRows
    }
  }

  private updateTableData() {
    this.updateSortedRows()
    const { columns, workspace, sortedRows } = this
    this.tableData = {
      columns: columns as ColumnData[],
      rows: [workspace as Experiment, ...(sortedRows as Experiment[])]
    }
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

    this.columns = columns
    this.workspace = workspace
    this.unsortedRows = branches

    this.updateTableData()

    return this.sendData()
  }

  private async sendData() {
    if (this.tableData && this.webview) {
      await this.webview.isReady()
      return this.webview.showExperiments({
        tableData: this.tableData
      })
    }
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
