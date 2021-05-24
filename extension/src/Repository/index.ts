import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import {
  SourceControlManagementState,
  SourceControlManagement
} from './views/SourceControlManagement'
import { DecorationProvider, DecorationState } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { status, listDvcOnlyRecursive, ListOutput } from '../cli/reader'
import { dirname, join } from 'path'
import { observable, makeObservable } from 'mobx'
import { getExecutionOptions } from '../cli/execution'

export enum Status {
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

  private dvcRoot: string

  public deleted: Set<string> = new Set()
  public modified: Set<string> = new Set()
  public new: Set<string> = new Set()
  public notInCache: Set<string> = new Set()
  public tracked: Set<string> = new Set()
  public untracked: Set<string> = new Set()

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

  public updateStatus(statusOutput: StatusOutput) {
    const status = this.reduceToChangedOutsStatuses(statusOutput)

    this.modified = status.modified || new Set<string>()
    this.deleted = status.deleted || new Set<string>()
    this.new = status.new || new Set<string>()
    this.notInCache = status['not in cache'] || new Set<string>()
  }

  public updateTracked(listOutput: ListOutput[]): void {
    const trackedPaths = listOutput.map(tracked => tracked.path)

    const absoluteTrackedPaths = this.getAbsolutePath(trackedPaths)

    this.tracked = new Set([
      ...absoluteTrackedPaths,
      ...this.getAbsoluteParentPath(trackedPaths)
    ])
  }

  public updateUntracked(untracked: Set<string>): void {
    this.untracked = untracked
  }

  public getState() {
    return {
      deleted: this.deleted,
      modified: this.modified,
      new: this.new,
      notInCache: this.notInCache,
      tracked: this.tracked,
      untracked: this.untracked
    }
  }

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }
}

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.state.getState()
  }

  @observable
  private state: RepositoryState

  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private sourceControlManagement: SourceControlManagement

  private async updateTracked(): Promise<void> {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const listOutput = await listDvcOnlyRecursive(options)

    this.state.updateTracked(listOutput)
  }

  private async updateStatus() {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const statusOutput = (await status(options)) as StatusOutput

    this.state.updateStatus(statusOutput)
  }

  private async updateUntracked() {
    const untracked = await getAllUntracked(this.dvcRoot)
    this.state.updateUntracked(untracked)
  }

  private updateStatuses() {
    return Promise.all([this.updateUntracked(), this.updateStatus()])
  }

  public async resetState() {
    const statusesUpdated = this.updateStatuses()

    const slowerTrackedUpdated = this.updateTracked()

    await statusesUpdated
    this.sourceControlManagement.setState(this.state.getState())

    await slowerTrackedUpdated
    this.decorationProvider?.setState(this.state.getState())
  }

  private setState() {
    this.sourceControlManagement.setState(this.state.getState())
    this.decorationProvider?.setState(this.state.getState())
  }

  public async updateState() {
    await this.updateStatuses()
    this.setState()
  }

  private async setup() {
    await this.resetState()
    return this.deferred.resolve()
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
    this.state = this.dispose.track(new RepositoryState(dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.state)
    )

    this.setup()
  }
}
