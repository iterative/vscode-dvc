import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from './git'
import {
  SourceControlManagementState,
  SourceControlManagement
} from './views/SourceControlManagement'
import { DecorationProvider, DecorationState } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { status, listDvcOnlyRecursive } from './cli/reader'
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

type StatusOutput = Record<string, (ValidStageOrFileStatuses | string)[]>

type FilteredStatusOutput = Record<string, ValidStageOrFileStatuses[]>

type ValidStageOrFileStatuses = Record<ChangedType, PathStatus>

type PathStatus = Record<string, Status>

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

  public async updateTracked(): Promise<void> {
    const tracked = await listDvcOnlyRecursive({
      cwd: this.dvcRoot,
      cliPath: this.config.dvcPath
    })
    this.state.tracked = new Set([
      ...this.getAbsolutePath(tracked),
      ...this.getAbsoluteParentPath(tracked)
    ])
  }

  private filterExcludedStagesOrFiles(
    statusOutput: StatusOutput
  ): FilteredStatusOutput {
    const excludeAlwaysChanged = (stageOrFile: string): boolean =>
      !statusOutput[stageOrFile].includes('always changed')

    const reduceToFiltered = (
      filteredStatusOutput: FilteredStatusOutput,
      stageOrFile: string
    ) => {
      filteredStatusOutput[stageOrFile] = statusOutput[
        stageOrFile
      ] as ValidStageOrFileStatuses[]
      return filteredStatusOutput
    }

    return Object.keys(statusOutput)
      .filter(excludeAlwaysChanged)
      .reduce(reduceToFiltered, {})
  }

  private getFileOrStageStatuses(
    fileOrStage: ValidStageOrFileStatuses[]
  ): PathStatus[] {
    return fileOrStage
      .map(
        entry =>
          entry?.[ChangedType.CHANGED_DEPS] || entry?.[ChangedType.CHANGED_OUTS]
      )
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

  private reduceToPathStatuses(
    filteredStatusOutput: FilteredStatusOutput
  ): Partial<Record<Status, Set<string>>> {
    const statusReducer = (
      reducedStatus: Partial<Record<Status, Set<string>>>,
      entry: ValidStageOrFileStatuses[]
    ): Partial<Record<Status, Set<string>>> => {
      const statuses = this.getFileOrStageStatuses(entry)

      this.reduceStatuses(reducedStatus, statuses)

      return reducedStatus
    }

    return Object.values(filteredStatusOutput).reduce(statusReducer, {})
  }

  private async getStatus(): Promise<Partial<Record<Status, Set<string>>>> {
    const statusOutput = (await status({
      cliPath: this.config.dvcPath,
      cwd: this.dvcRoot
    })) as Record<string, (ValidStageOrFileStatuses | string)[]>

    const filteredStatusOutput = this.filterExcludedStagesOrFiles(statusOutput)
    return this.reduceToPathStatuses(filteredStatusOutput)
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

  public async updateState() {
    const promisesForScm = Promise.all([
      this.updateUntracked(),
      this.updateStatus()
    ])

    const extraPromiseForDecoration = this.updateTracked()

    await promisesForScm
    this.sourceControlManagement.setResourceStates(this.state)

    if (this.decorationProvider) {
      await extraPromiseForDecoration
      this.decorationProvider.setState(this.state)
    }
  }

  private async setup() {
    await this.updateState()
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
