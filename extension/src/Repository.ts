import { Config } from './Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from './git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { status, listDvcOnlyRecursive } from './cli/reader'
import { dirname, join } from 'path'

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

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  public get ready() {
    return this.initialized
  }

  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private scm?: SourceControlManagement

  tracked = new Set<string>()
  deleted = new Set<string>()
  modified = new Set<string>()
  new = new Set<string>()
  notInCache = new Set<string>()
  untracked = new Set<string>()

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
    const dvcListFiles = await listDvcOnlyRecursive({
      cwd: this.dvcRoot,
      cliPath: this.config.dvcPath
    })
    this.tracked = new Set([
      ...this.getAbsolutePath(dvcListFiles),
      ...this.getAbsoluteParentPath(dvcListFiles)
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

    this.modified = status.modified || new Set<string>()
    this.deleted = status.deleted || new Set<string>()
    this.new = status.new || new Set<string>()
    this.notInCache = status['not in cache'] || new Set<string>()

    this.scm?.setResourceStates({
      deleted: this.deleted,
      modified: this.modified,
      new: this.new,
      notInCache: this.notInCache,
      untracked: this.untracked
    })
  }

  public async updateUntracked() {
    this.untracked = await getAllUntracked(this.dvcRoot)
    return this.scm?.setResourceStates({
      deleted: this.deleted,
      modified: this.modified,
      new: this.new,
      notInCache: this.notInCache,
      untracked: this.untracked
    })
  }

  public updateState() {
    return Promise.all([
      this.updateTracked(),
      this.updateUntracked(),
      this.updateStatus()
    ])
  }

  public async setup() {
    await this.updateState()

    this.decorationProvider?.setState({
      tracked: this.tracked,
      deleted: new Set<string>(),
      modified: new Set<string>(),
      new: new Set<string>(),
      notInCache: new Set<string>()
    })

    this.scm = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, {
        deleted: this.deleted,
        modified: this.modified,
        new: this.new,
        notInCache: this.notInCache,
        untracked: this.untracked
      })
    )

    this._initialized.resolve()
  }

  constructor(
    dvcRoot: string,
    config: Config,
    decorationProvider?: DecorationProvider
  ) {
    this.config = config
    this.decorationProvider = decorationProvider
    this.dvcRoot = dvcRoot
  }
}
