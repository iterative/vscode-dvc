import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import {
  SourceControlManagementState,
  SourceControlManagement
} from './views/SourceControlManagement'
import { DecorationProvider, DecorationState } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { diff, DiffOutput, listDvcOnlyRecursive, status } from '../cli/reader'
import { dirname, join, resolve } from 'path'
import { observable, makeObservable } from 'mobx'
import { ExecutionOptions, getExecutionOptions } from '../cli/execution'
import { isDirectory } from '../fileSystem'

export enum Status {
  ADDED = 'added',
  DELETED = 'deleted',
  MODIFIED = 'modified',
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

  public added: Set<string> = new Set()
  public deleted: Set<string> = new Set()
  public modified: Set<string> = new Set()
  public notInCache: Set<string> = new Set()
  public stageModified: Set<string> = new Set()
  public tracked: Set<string> = new Set()
  public untracked: Set<string> = new Set()

  private mapStatusToState(status?: { path: string }[]): Set<string> {
    return new Set<string>(status?.map(entry => join(this.dvcRoot, entry.path)))
  }

  private getModified(
    diff: { path: string }[] | undefined,
    filter: (path: string) => boolean
  ) {
    return new Set(
      diff?.map(entry => resolve(this.dvcRoot, entry.path)).filter(filter)
    )
  }

  public update(
    diff: DiffOutput,
    status: Partial<Record<Status, Set<string>>>
  ): void {
    this.added = this.mapStatusToState(diff.added)
    this.deleted = this.mapStatusToState(diff.deleted)
    this.notInCache = this.mapStatusToState(diff['not in cache'])

    const pathMatchesDvc = (path: string): boolean => {
      if (isDirectory(path)) {
        return !status.modified?.has(resolve(path))
      }
      return !(
        status.modified?.has(path) || status.modified?.has(dirname(path))
      )
    }

    this.modified = this.getModified(
      diff.modified,
      path => !pathMatchesDvc(path)
    )
    this.stageModified = this.getModified(diff.modified, pathMatchesDvc)
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
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const listOutput = await listDvcOnlyRecursive(options)
    const trackedPaths = listOutput.map(tracked => tracked.path)

    const absoluteTrackedPaths = this.getAbsolutePath(trackedPaths)

    this.state.tracked = new Set([
      ...absoluteTrackedPaths,
      ...this.getAbsoluteParentPath(trackedPaths)
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

  private async getDiffFromDvc(
    options: ExecutionOptions
  ): Promise<Partial<Record<Status, Set<string>>>> {
    const statusOutput = (await status(options)) as StatusOutput

    return this.reduceToChangedOutsStatuses(statusOutput)
  }

  public async updateStatus() {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const [diffFromHead, diffFromDvc] = await Promise.all([
      diff(options),
      this.getDiffFromDvc(options)
    ])
    return this.state.update(diffFromHead, diffFromDvc)
  }

  public async updateUntracked() {
    this.state.untracked = await getAllUntracked(this.dvcRoot)
  }

  private updateStatuses() {
    return Promise.all([this.updateUntracked(), this.updateStatus()])
  }

  public async resetState() {
    const statusesUpdated = this.updateStatuses()

    const slowerTrackedUpdated = this.updateList()

    await statusesUpdated
    this.sourceControlManagement.setState(this.state)

    await slowerTrackedUpdated
    this.decorationProvider?.setState(this.state)
  }

  private setState() {
    this.sourceControlManagement.setState(this.state)
    this.decorationProvider?.setState(this.state)
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
    this.state = this.dispose.track(new RepositoryState(this.dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.state)
    )

    this.setup()
  }
}
