import { dirname, resolve } from 'path'
import isEqual from 'lodash.isequal'
import { Disposable } from '@hediet/std/disposable'
import {
  collectModifiedAgainstHead,
  collectTracked,
  collectTree,
  PathItem
} from '../data/collect'
import { SourceControlManagementModel } from '../sourceControlManagement'
import { DecorationModel } from '../decorationProvider'
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
} from '../../cli/reader'
import { isSameOrChild } from '../../fileSystem'

type OutputData = {
  diffFromCache: StatusOutput
  diffFromHead: DiffOutput
  tracked?: ListOutput[]
  untracked: Set<string>
}

type ModifiedAndNotInCache = {
  [Status.MODIFIED]: Set<string>
  [Status.NOT_IN_CACHE]: Set<string>
}

export class RepositoryModel
  implements DecorationModel, SourceControlManagementModel
{
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string

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

  private tree = new Map<string, PathItem[]>()

  constructor(dvcRoot: string) {
    this.dvcRoot = dvcRoot
  }

  public getState() {
    return this.state
  }

  public getChildren(path: string): PathItem[] {
    return this.tree.get(path) || []
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

  private getChangedOutsStatuses(
    fileOrStage: StatusesOrAlwaysChanged[]
  ): PathStatus[] {
    return fileOrStage
      .map(entry => (entry as StageOrFileStatuses)?.[ChangedType.CHANGED_OUTS])
      .filter(value => value) as PathStatus[]
  }

  private collectStatuses(
    entry: PathStatus,
    reducedStatus: ModifiedAndNotInCache
  ) {
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
  }

  private reduceStatus(statusOutput: StatusOutput): ModifiedAndNotInCache {
    const statusReducer = (
      modifiedAndNotInCache: ModifiedAndNotInCache,
      entry: StatusesOrAlwaysChanged[]
    ): ModifiedAndNotInCache => {
      const statuses = this.getChangedOutsStatuses(entry)

      statuses.map(entry => this.collectStatuses(entry, modifiedAndNotInCache))

      return modifiedAndNotInCache
    }

    return Object.values(statusOutput).reduce(statusReducer, {
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
    while (this.dvcRoot !== path) {
      if (set.has(path)) {
        return false
      }
      path = dirname(path)
    }
    return true
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

  private setModifiedAndNotInCache(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    const modifiedAgainstHead = collectModifiedAgainstHead(
      this.dvcRoot,
      diffOutput.modified || [],
      this.state.tracked
    )

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

    this.state.notInCache = new Set([
      ...this.getStateFromDiff(diffOutput[Status.NOT_IN_CACHE]),
      ...this.splitModifiedAgainstHead(modifiedAgainstHead, path =>
        this.pathInSet(path, notInCache)
      )
    ])
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

    this.setModifiedAndNotInCache(diffOutput, statusOutput)
  }

  private updateTracked(listOutput: ListOutput[]): void {
    const trackedPaths = listOutput.map(tracked => tracked.path)

    const tracked = collectTracked(this.dvcRoot, trackedPaths)

    if (!isEqual(tracked, this.state.tracked)) {
      this.tree = collectTree(this.dvcRoot, trackedPaths)
    }

    this.state.tracked = tracked
  }
}
