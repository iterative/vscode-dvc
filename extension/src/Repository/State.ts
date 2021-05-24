import { Disposable } from '@hediet/std/disposable'
import { SourceControlManagementState } from './views/SourceControlManagement'
import { DecorationState } from './DecorationProvider'
import {
  ChangedType,
  DiffOutput,
  ListOutput,
  PathOutput,
  PathStatus,
  StageOrFileStatuses,
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

  private reduceModified(reducedStatus: Set<string>, statuses: PathStatus[]) {
    return statuses.map(entry =>
      Object.entries(entry)
        .filter(([, status]) => status === 'modified')
        .map(([relativePath]) => {
          const absolutePath = join(this.dvcRoot, relativePath)
          const existingPaths = reducedStatus || new Set<string>()
          reducedStatus = existingPaths.add(absolutePath)
        })
    )
  }

  private reduceToModified(filteredStatusOutput: StatusOutput): Set<string> {
    const statusReducer = (
      reducedStatus: Set<string>,
      entry: StatusesOrAlwaysChanged[]
    ): Set<string> => {
      const statuses = this.getChangedOutsStatuses(entry)

      this.reduceModified(reducedStatus, statuses)

      return reducedStatus
    }

    return Object.values(filteredStatusOutput).reduce(statusReducer, new Set())
  }

  private mapToAbsolutePaths(diff: PathOutput[] = []): string[] {
    return diff.map(entry => resolve(this.dvcRoot, entry.path))
  }

  private getStateFromDiff(diff?: PathOutput[]): Set<string> {
    return new Set<string>(this.mapToAbsolutePaths(diff))
  }

  private pathInSet = (path: string, set?: Set<string>): boolean =>
    !this.pathNotInSet(path, set)

  private pathNotInSet = (path: string, set?: Set<string>): boolean => {
    if (isDirectory(path)) {
      return !set?.has(path)
    }
    return !(set?.has(path) || set?.has(dirname(path)))
  }

  private getModified(
    modifiedAgainstHead: string[],
    filter: (path: string) => boolean
  ): Set<string> {
    return new Set(modifiedAgainstHead?.filter(filter))
  }

  private setModified(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    const modifiedAgainstCache = this.reduceToModified(statusOutput)
    const modifiedAgainstHead = this.mapToAbsolutePaths(diffOutput.modified)

    this.modified = this.getModified(modifiedAgainstHead, path =>
      this.pathInSet(path, modifiedAgainstCache)
    )

    this.stageModified = this.getModified(modifiedAgainstHead, path =>
      this.pathNotInSet(path, modifiedAgainstCache)
    )
  }

  public updateStatus(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    this.added = this.getStateFromDiff(diffOutput.added)
    this.deleted = this.getStateFromDiff(diffOutput.deleted)
    this.notInCache = this.getStateFromDiff(diffOutput['not in cache'])

    this.setModified(diffOutput, statusOutput)
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
