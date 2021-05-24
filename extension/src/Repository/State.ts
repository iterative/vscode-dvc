import { SourceControlManagementState } from './views/SourceControlManagement'
import { DecorationState } from './DecorationProvider'
import { DiffOutput, ListOutput } from '../cli/reader'
import { dirname, join, resolve } from 'path'
import { isDirectory } from '../fileSystem'
import { Disposable } from '@hediet/std/disposable'

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

export type StatusOutput = Record<string, StatusesOrAlwaysChanged[]>

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

  public updateTracked(listOutput: ListOutput[]): void {
    const trackedPaths = listOutput.map(tracked => tracked.path)

    const absoluteTrackedPaths = this.getAbsolutePath(trackedPaths)

    this.tracked = new Set([
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

  private getDiffFromDvc(
    statusOutput: StatusOutput
  ): Partial<Record<Status, Set<string>>> {
    return this.reduceToChangedOutsStatuses(statusOutput)
  }

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

  public updateStatus(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    this.added = this.mapStatusToState(diffOutput.added)
    this.deleted = this.mapStatusToState(diffOutput.deleted)
    this.notInCache = this.mapStatusToState(diffOutput['not in cache'])

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

  public updateUntracked(untracked: Set<string>): void {
    this.untracked = untracked
  }

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }
}
