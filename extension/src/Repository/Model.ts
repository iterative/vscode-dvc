import { Disposable } from '@hediet/std/disposable'
import { SourceControlManagementModel } from './views/SourceControlManagement'
import { DecorationModel } from './DecorationProvider'
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

export class RepositoryModel
  implements DecorationModel, SourceControlManagementModel {
  public dispose = Disposable.fn()

  private dvcRoot: string

  private state = {
    added: new Set<string>(),
    deleted: new Set<string>(),
    modified: new Set<string>(),
    notInCache: new Set<string>(),
    renamed: new Set<string>(),
    stageModified: new Set<string>(),
    tracked: new Set<string>(),
    untracked: new Set<string>()
  }

  public getState() {
    return this.state
  }

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
    return diff
      .map(entry => this.getAbsolutePath(entry.path))
      .filter(path => this.state.tracked.has(path))
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

    this.state.modified = this.splitModified(modifiedAgainstHead, path =>
      this.pathInSet(path, modifiedAgainstCache)
    )

    this.state.stageModified = this.splitModified(modifiedAgainstHead, path =>
      this.pathNotInSet(path, modifiedAgainstCache)
    )
  }

  private updateStatus(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    this.state.added = this.getStateFromDiff(diffOutput.added)
    this.state.deleted = this.getStateFromDiff(diffOutput.deleted)
    this.state.renamed = this.getStateFromDiff(diffOutput.renamed)
    this.state.notInCache = this.getStateFromDiff(diffOutput['not in cache'])

    this.setModified(diffOutput, statusOutput)
  }

  private updateTracked(listOutput: ListOutput[]): void {
    const trackedPaths = listOutput.map(tracked => tracked.path)

    const absoluteTrackedPaths = this.getAbsolutePaths(trackedPaths)

    this.state.tracked = new Set([
      ...absoluteTrackedPaths,
      ...this.getAbsoluteParentPath(trackedPaths)
    ])
  }

  private updateUntracked(untracked: Set<string>): void {
    this.state.untracked = untracked
  }

  public setState(data: {
    diffFromCache: StatusOutput
    diffFromHead: DiffOutput
    tracked?: ListOutput[]
    untracked: Set<string>
  }) {
    if (data.tracked) {
      this.updateTracked(data.tracked)
    }
    this.updateStatus(data.diffFromHead, data.diffFromCache)
    this.updateUntracked(data.untracked)
  }

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }
}
