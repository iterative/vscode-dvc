import { Disposable } from '@hediet/std/disposable'
import { SourceControlManagementState } from './views/SourceControlManagement'
import { DecorationState } from './DecorationProvider'
import {
  ChangedType,
  DiffOutput,
  ListOutput,
  PathStatus,
  StageOrFileStatuses,
  Status,
  StatusesOrAlwaysChanged,
  StatusOutput
} from '../cli/reader'
import { dirname, join, resolve } from 'path'
import { isDirectory } from '../fileSystem'

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

  private getDiffFromDvc(
    statusOutput: StatusOutput
  ): Partial<Record<Status, Set<string>>> {
    return this.reduceToChangedOutsStatuses(statusOutput)
  }

  private mapDiffToState(status?: { path: string }[]): Set<string> {
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

  public updateStatus(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    this.added = this.mapDiffToState(diffOutput.added)
    this.deleted = this.mapDiffToState(diffOutput.deleted)
    this.notInCache = this.mapDiffToState(diffOutput['not in cache'])

    const status = this.getDiffFromDvc(statusOutput)

    const pathMatchesDvc = (path: string): boolean => {
      if (isDirectory(path)) {
        return !status.modified?.has(path)
      }
      return !(
        status.modified?.has(path) || status.modified?.has(dirname(path))
      )
    }

    this.modified = this.getModified(
      diffOutput.modified,
      path => !pathMatchesDvc(path)
    )

    this.stageModified = this.getModified(diffOutput.modified, pathMatchesDvc)
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
      added: this.added,
      deleted: this.deleted,
      modified: this.modified,
      notInCache: this.notInCache,
      stageModified: this.stageModified,
      tracked: this.tracked,
      untracked: this.untracked
    }
  }

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }
}
