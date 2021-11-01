import { dirname, resolve } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { SourceControlManagementModel } from './sourceControlManagement'
import { DecorationModel } from './decorationProvider'
import {
  ChangedType,
  DiffOutput,
  ListOutput,
  PathOutput,
  PathStatus,
  StageOrFileStatuses,
  Status,
  StatusesOrAlwaysChanged,
  StatusOutput
} from '../cli/reader'
import { isDirectory } from '../fileSystem'

type OutputData = {
  diffFromCache: StatusOutput
  diffFromHead: DiffOutput
  tracked?: ListOutput[]
  untracked: Set<string>
}

type ReducedStatusOutput = {
  [Status.MODIFIED]: Set<string>
  [Status.NOT_IN_CACHE]: Set<string>
}

export class RepositoryModel
  implements DecorationModel, SourceControlManagementModel
{
  public dispose = Disposable.fn()

  private dvcRoot: string

  private state = {
    added: new Set<string>(),
    deleted: new Set<string>(),
    gitModified: new Set<string>(),
    modified: new Set<string>(),
    notInCache: new Set<string>(),
    renamed: new Set<string>(),
    tracked: new Set<string>(),
    untracked: new Set<string>()
  }

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }

  public getState() {
    return this.state
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

    this.state.untracked = untracked
  }

  public hasChanges(): boolean {
    return !!(
      this.state.added.size ||
      this.state.deleted.size ||
      this.state.gitModified.size ||
      this.state.modified.size ||
      this.state.renamed.size
    )
  }

  private getAbsolutePath(path: string): string {
    return resolve(this.dvcRoot, path)
  }

  private getAbsolutePaths(paths: string[] = []): string[] {
    return paths.map(path => this.getAbsolutePath(path))
  }

  private getAbsoluteParentPath(files: string[] = []): string[] {
    return files
      .map(file => this.getAbsolutePath(dirname(file)))
      .filter(dir => dir !== this.dvcRoot)
  }

  private getChangedOutsStatuses(
    fileOrStage: StatusesOrAlwaysChanged[]
  ): PathStatus[] {
    return fileOrStage
      .map(entry => (entry as StageOrFileStatuses)?.[ChangedType.CHANGED_OUTS])
      .filter(value => value) as PathStatus[]
  }

  private reduceStatus(
    filteredStatusOutput: StatusOutput
  ): ReducedStatusOutput {
    const statusReducer = (
      reducedStatus: {
        [Status.MODIFIED]: Set<string>
        [Status.NOT_IN_CACHE]: Set<string>
      },
      entry: StatusesOrAlwaysChanged[]
    ): ReducedStatusOutput => {
      const statuses = this.getChangedOutsStatuses(entry)

      statuses.map(entry =>
        Object.entries(entry)
          .filter(([, status]) =>
            [Status.NOT_IN_CACHE, Status.MODIFIED].includes(status)
          )
          .map(([relativePath, status]) => {
            const absolutePath = this.getAbsolutePath(relativePath)

            if (!this.state.tracked.has(absolutePath)) {
              return
            }

            reducedStatus[status as Status.NOT_IN_CACHE | Status.MODIFIED].add(
              absolutePath
            )
          })
      )

      return reducedStatus
    }

    return Object.values(filteredStatusOutput).reduce(statusReducer, {
      [Status.MODIFIED]: new Set(),
      [Status.NOT_IN_CACHE]: new Set()
    })
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
    const modifiedAgainstHead = this.mapToTrackedPaths(diffOutput.modified)
    const {
      [Status.MODIFIED]: modifiedAgainstCache,
      [Status.NOT_IN_CACHE]: notInCache
    } = this.reduceStatus(statusOutput)

    this.state.gitModified = this.splitModifiedAgainstHead(
      modifiedAgainstHead,
      path =>
        this.pathNotInSet(
          path,
          new Set([...notInCache, ...modifiedAgainstCache])
        )
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
    this.state.renamed = new Set(
      diffOutput.renamed
        ?.map(renamed => this.getAbsolutePath(renamed?.path?.new))
        .filter(path => this.state.tracked.has(path))
    )

    this.state.notInCache = this.getStateFromDiff(
      diffOutput[Status.NOT_IN_CACHE]
    )

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
}
