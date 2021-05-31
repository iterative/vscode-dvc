import { Disposable } from '@hediet/std/disposable'
import { SourceControlManagementModel } from './views/sourceControlManagement'
import { DecorationModel } from './decorationProvider'
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

type OutputData = {
  diffFromCache: StatusOutput
  diffFromHead: DiffOutput
  tracked?: ListOutput[]
  untracked: Set<string>
}

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
          const existingPaths = reducedStatus
          if (this.state.tracked.has(absolutePath)) {
            reducedStatus = existingPaths.add(absolutePath)
          }
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

  private mapToTrackedPaths(diff: PathOutput[] = []): string[] {
    return diff
      .map(entry => this.getAbsolutePath(entry.path))
      .filter(path => this.state.tracked.has(path))
  }

  private getStateFromDiff(diff?: PathOutput[]): Set<string> {
    return new Set<string>(this.mapToTrackedPaths(diff))
  }

  private pathInSet = (path: string, set?: Set<string>): boolean =>
    !this.pathNotInSet(path, set)

  private pathNotInSet = (
    path: string,
    set: Set<string> = new Set()
  ): boolean => {
    if (isDirectory(path)) {
      return !set.has(path)
    }
    return !(set.has(path) || set.has(dirname(path)))
  }

  private splitModifiedAgainstHead(
    modifiedAgainstHead: string[],
    filter: (path: string) => boolean
  ): Set<string> {
    return new Set(modifiedAgainstHead.filter(filter))
  }

  private getAllModifiedAgainstCache(
    modifiedAgainstHead: string[],
    modifiedAgainstCache: Set<string>
  ): Set<string> {
    return new Set<string>([
      ...this.splitModifiedAgainstHead(modifiedAgainstHead, path =>
        this.pathInSet(path, modifiedAgainstCache)
      ),
      ...modifiedAgainstCache
    ])
  }

  private setModified(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    const modifiedAgainstCache = this.reduceToModified(statusOutput)
    const modifiedAgainstHead = this.mapToTrackedPaths(diffOutput.modified)

    this.state.stageModified = this.splitModifiedAgainstHead(
      modifiedAgainstHead,
      path => this.pathNotInSet(path, modifiedAgainstCache)
    )

    this.state.modified = this.getAllModifiedAgainstCache(
      modifiedAgainstHead,
      modifiedAgainstCache
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

  public setState({
    diffFromCache,
    diffFromHead,
    tracked,
    untracked
  }: OutputData) {
    if (tracked) {
      this.updateTracked(tracked)
    }
    this.updateStatus(diffFromHead, diffFromCache)
    this.updateUntracked(untracked)
  }

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }
}
