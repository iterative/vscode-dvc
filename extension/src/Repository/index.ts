import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import {
  SourceControlManagementState,
  SourceControlManagement
} from './views/SourceControlManagement'
import { DecorationProvider, DecorationState } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { diff, DiffOutput, listDvcOnlyRecursive } from '../cli/reader'
import { dirname, join } from 'path'
import { observable, makeObservable } from 'mobx'
import { getExecutionOptions } from '../cli/execution'

export enum Status {
  ADDED = 'added',
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NOT_IN_CACHE = 'not in cache'
}
export class RepositoryState
  implements DecorationState, SourceControlManagementState {
  public dispose = Disposable.fn()

  public added: Set<string>
  public deleted: Set<string>
  public modified: Set<string>
  public notInCache: Set<string>
  public tracked: Set<string>
  public untracked: Set<string>

  constructor() {
    this.tracked = new Set<string>()
    this.deleted = new Set<string>()
    this.modified = new Set<string>()
    this.added = new Set<string>()
    this.notInCache = new Set<string>()
    this.untracked = new Set<string>()
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

  private mapStatusToState(status?: { path: string }[]): Set<string> {
    return new Set<string>(status?.map(entry => join(this.dvcRoot, entry.path)))
  }

  private getStateFromDiff(diff: DiffOutput) {
    this.state.added = this.mapStatusToState(diff.added)
    this.state.deleted = this.mapStatusToState(diff.deleted)
    this.state.modified = this.mapStatusToState(diff.modified)
    this.state.notInCache = this.mapStatusToState(diff['not in cache'])
  }

  public async updateStatus() {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const diffOutput = await diff(options)
    return this.getStateFromDiff(diffOutput)
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
    this.state = this.dispose.track(new RepositoryState())

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.state)
    )

    this.setup()
  }
}
