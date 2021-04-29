import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import {
  SourceControlManagementState,
  SourceControlManagement
} from './views/SourceControlManagement'
import { DecorationProvider, DecorationState } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { status, listDvcOnlyRecursive } from '../cli/reader'
import { dirname, join } from 'path'
import { observable, makeObservable } from 'mobx'

enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'not in cache'
}

enum ChangedType {
  CHANGED_OUTS = 'changed outs',
  CHANGED_DEPS = 'changed deps'
}

type PathStatus = Record<string, Status>

type StageOrFileStatuses = Record<ChangedType, PathStatus>

type StatusesOrAlwaysChanged = StageOrFileStatuses | 'always changed'

type StatusOutput = Record<string, StatusesOrAlwaysChanged[]>

export class RepositoryState
  implements DecorationState, SourceControlManagementState {
  public dispose = Disposable.fn()

  public tracked: Set<string>
  public deleted: Set<string>
  public modified: Set<string>
  public new: Set<string>
  public notInCache: Set<string>
  public untracked: Set<string>

  constructor() {
    this.tracked = new Set<string>()
    this.deleted = new Set<string>()
    this.modified = new Set<string>()
    this.new = new Set<string>()
    this.notInCache = new Set<string>()
    this.untracked = new Set<string>()
  }
}

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  public get ready() {
    return this.initialized
  }

  public getState() {
    return this.state
  }

  public getTracked() {
    return this.state.tracked
  }

  @observable
  private state: RepositoryState

  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private sourceControlManagement: SourceControlManagement

  private getCliExecutionOptions() {
    return {
      cliPath: this.config.dvcPath,
      pythonBinPath: this.config.pythonBinPath,
      cwd: this.dvcRoot
    }
  }

  private filterRootDir(dirs: string[] = []) {
    return dirs.filter(dir => dir !== this.dvcRoot)
  }

  private getAbsolutePath(files: string[] = []): string[] {
    return files.map(file => join(this.dvcRoot, file))
  }

  private getAbsoluteParentPath(files: string[] = []): string[] {
    return this.filterRootDir(
      files.map(file => join(this.dvcRoot, dirname(file)))
    )
  }

  public async updateList(): Promise<void> {
    const options = this.getCliExecutionOptions()
    const tracked = await listDvcOnlyRecursive(options)

    const absoluteTrackedPaths = this.getAbsolutePath(tracked)

    this.state.tracked = new Set([
      ...absoluteTrackedPaths,
      ...this.getAbsoluteParentPath(tracked)
    ])
  }

  private getChangedOutsStatuses(
    fileOrStage: StatusesOrAlwaysChanged[]
  ): PathStatus[] {
    return fileOrStage
      .map(entry => (entry as StageOrFileStatuses)?.[ChangedType.CHANGED_OUTS])
      .filter(value => value)
  }

  private reduceStatuses(
    reducedStatus: Partial<Record<Status, Set<string>>>,
    statuses: PathStatus[]
  ) {
    return statuses.map(entry =>
      Object.entries(entry).map(([relativePath, status]) => {
        const absolutePath = join(this.dvcRoot, relativePath)
        const existingPaths = reducedStatus[status] || new Set<string>()
        reducedStatus[status] = existingPaths.add(absolutePath)
      })
    )
  }

  private reduceToChangedOutsStatuses(
    filteredStatusOutput: StatusOutput
  ): Partial<Record<Status, Set<string>>> {
    const statusReducer = (
      reducedStatus: Partial<Record<Status, Set<string>>>,
      entry: StatusesOrAlwaysChanged[]
    ): Partial<Record<Status, Set<string>>> => {
      const statuses = this.getChangedOutsStatuses(entry)

      this.reduceStatuses(reducedStatus, statuses)

      return reducedStatus
    }

    return Object.values(filteredStatusOutput).reduce(statusReducer, {})
  }

  private async getStatus(): Promise<Partial<Record<Status, Set<string>>>> {
    const options = this.getCliExecutionOptions()
    const statusOutput = (await status(options)) as StatusOutput

    return this.reduceToChangedOutsStatuses(statusOutput)
  }

  public async updateStatus() {
    const status = await this.getStatus()

    this.state.modified = status.modified || new Set<string>()
    this.state.deleted = status.deleted || new Set<string>()
    this.state.new = status.new || new Set<string>()
    this.state.notInCache = status['not in cache'] || new Set<string>()
  }

  public async updateUntracked() {
    this.state.untracked = await getAllUntracked(this.dvcRoot)
  }

  private updateScmStatuses() {
    return Promise.all([this.updateUntracked(), this.updateStatus()])
  }

  public async resetState() {
    const scmStatusesUpdated = this.updateScmStatuses()

    const slowerTrackedUpdated = this.updateList()

    await scmStatusesUpdated
    this.sourceControlManagement.setState(this.state)

    await slowerTrackedUpdated
    this.decorationProvider?.setState(this.state)
  }

  private setState() {
    this.sourceControlManagement.setState(this.state)
    this.decorationProvider?.setState(this.state)
  }

  public async updateState() {
    await this.updateScmStatuses()
    this.setState()
  }

  private async setup() {
    await this.resetState()
    return this._initialized.resolve()
  }

  constructor(
    dvcRoot: string,
    config: Config,
    decorationProvider?: DecorationProvider
  ) {
    makeObservable(this)
    this.config = config
    this.decorationProvider = decorationProvider
    this.dvcRoot = dvcRoot
    this.state = this.dispose.track(new RepositoryState())

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.state)
    )

    this.setup()
  }
}
