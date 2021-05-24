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
import { dirname, resolve } from 'path'
import { isDirectory } from '../fileSystem'

export class Model implements DecorationState, SourceControlManagementState {
  public dispose = Disposable.fn()

  private dvcRoot: string

  public added: Set<string> = new Set()
  public deleted: Set<string> = new Set()
  public modified: Set<string> = new Set()
  public notInCache: Set<string> = new Set()
  public renamed: Set<string> = new Set()
  public stageModified: Set<string> = new Set()
  public tracked: Set<string> = new Set()
  public untracked: Set<string> = new Set()

  private filterRootDir(dirs: string[] = []) {
    return dirs.filter(dir => dir !== this.dvcRoot)
  }

  private getAbsolutePath(path: string): string {
    return resolve(this.dvcRoot, path)
  }

  private getAbsolutePaths(paths: string[] = []): string[] {
    return paths.map(path => this.getAbsolutePath(path))
  }

  private getAbsoluteParentPath(files: string[] = []): string[] {
    return this.filterRootDir(
      files.map(file => this.getAbsolutePath(dirname(file)))
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
          const absolutePath = this.getAbsolutePath(relativePath)
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
    return diff.map(entry => this.getAbsolutePath(entry.path))
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

  private splitModified(
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

    this.modified = this.splitModified(modifiedAgainstHead, path =>
      this.pathInSet(path, modifiedAgainstCache)
    )

    this.stageModified = this.splitModified(modifiedAgainstHead, path =>
      this.pathNotInSet(path, modifiedAgainstCache)
    )
  }

  public updateStatus(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    this.added = this.getStateFromDiff(diffOutput.added)
    this.deleted = this.getStateFromDiff(diffOutput.deleted)
    this.renamed = this.getStateFromDiff(diffOutput.renamed)
    this.notInCache = this.getStateFromDiff(diffOutput['not in cache'])

    this.setModified(diffOutput, statusOutput)
  }

  public updateTracked(listOutput: ListOutput[]): void {
    const trackedPaths = listOutput.map(tracked => tracked.path)

    const absoluteTrackedPaths = this.getAbsolutePaths(trackedPaths)

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
      renamed: this.renamed,
      stageModified: this.stageModified,
      tracked: this.tracked,
      untracked: this.untracked
    }
  }

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }
}
