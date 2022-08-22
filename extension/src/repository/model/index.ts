import { dirname, join, resolve } from 'path'
import {
  collectDeleted,
  collectModifiedAgainstHead,
  collectTrackedNonLeafs,
  collectTrackedOuts,
  collectTree,
  PathItem
} from './collect'
import {
  SourceControlManagementModel,
  SourceControlManagementState
} from '../sourceControlManagement'
import { DecorationModel, DecorationState } from '../decorationProvider'
import {
  ChangedType,
  DiffOutput,
  ExperimentsOutput,
  ListOutput,
  PathOutput,
  PathStatus,
  StageOrFileStatuses,
  Status,
  StatusesOrAlwaysChanged,
  StatusOutput
} from '../../cli/dvc/reader'
import { Disposable } from '../../class/dispose'
import { sameContents } from '../../util/array'
import { Data } from '../data'

type ModifiedAndNotInCache = {
  [Status.MODIFIED]: Set<string>
  [Status.NOT_IN_CACHE]: Set<string>
}

export class RepositoryModel
  extends Disposable
  implements DecorationModel, SourceControlManagementModel
{
  private readonly dvcRoot: string

  private state = {
    added: new Set<string>(),
    deleted: new Set<string>(),
    gitModified: new Set<string>(),
    hasGitChanges: false,
    modified: new Set<string>(),
    notInCache: new Set<string>(),
    renamed: new Set<string>(),
    trackedLeafs: new Set<string>(),
    trackedNonLeafs: new Set<string>(),
    untracked: new Set<string>()
  }

  private tree = new Map<string, PathItem[]>()
  private relTrackedOuts = new Set<string>()

  constructor(dvcRoot: string) {
    super()

    this.dvcRoot = dvcRoot
  }

  public getDecorationState(): DecorationState {
    return {
      added: this.state.added,
      deleted: this.state.deleted,
      gitModified: this.state.gitModified,
      modified: this.state.modified,
      notInCache: this.state.notInCache,
      renamed: this.state.renamed,
      tracked: this.getTracked()
    }
  }

  public getSourceControlManagementState(): SourceControlManagementState {
    const acc = []
    for (const relTrackedOut of this.relTrackedOuts) {
      acc.push(join(this.dvcRoot, relTrackedOut))
    }

    return {
      added: this.state.added,
      deleted: this.state.deleted,
      gitModified: this.state.gitModified,
      hasRemote: new Set([...acc, ...this.state.trackedLeafs]),
      modified: this.state.modified,
      notInCache: this.state.notInCache,
      renamed: this.state.renamed,
      untracked: this.state.untracked
    }
  }

  public getChildren(path: string): PathItem[] {
    return this.tree.get(path) || []
  }

  public setState({
    diffFromCache,
    diffFromHead,
    hasGitChanges,
    tracked,
    untracked
  }: Data) {
    if (tracked) {
      this.updateTracked(tracked)
    }
    this.updateStatus(diffFromHead, diffFromCache)

    this.state.untracked = untracked
    this.state.hasGitChanges = hasGitChanges
  }

  public hasChanges(): boolean {
    return !!(
      this.state.added.size > 0 ||
      this.state.deleted.size > 0 ||
      this.state.gitModified.size > 0 ||
      this.state.modified.size > 0 ||
      this.state.renamed.size > 0 ||
      this.state.untracked.size > 0 ||
      this.state.hasGitChanges
    )
  }

  public transformAndSetExperiments(data: ExperimentsOutput) {
    const relTrackedOuts = collectTrackedOuts(data)

    if (!sameContents([...relTrackedOuts], [...this.relTrackedOuts])) {
      this.relTrackedOuts = relTrackedOuts
      this.collectTree()
    }
  }

  private getAbsolutePath(path: string): string {
    return resolve(this.dvcRoot, path)
  }

  private getChangedOutsStatuses(
    fileOrStage: StatusesOrAlwaysChanged[]
  ): PathStatus[] {
    return fileOrStage
      .map(entry => (entry as StageOrFileStatuses)?.[ChangedType.CHANGED_OUTS])
      .filter(Boolean) as PathStatus[]
  }

  private collectStatuses(acc: ModifiedAndNotInCache, entry: PathStatus) {
    Object.entries(entry)
      .filter(([, status]) =>
        [Status.NOT_IN_CACHE, Status.MODIFIED].includes(status)
      )
      .map(([relativePath, status]) => {
        const absolutePath = this.getAbsolutePath(relativePath)

        if (!this.isTracked(absolutePath)) {
          return
        }

        acc[status as Status.NOT_IN_CACHE | Status.MODIFIED].add(absolutePath)
      })
  }

  private collectModifiedAndNotInCache(
    statusOutput: StatusOutput
  ): ModifiedAndNotInCache {
    const acc: ModifiedAndNotInCache = {
      [Status.MODIFIED]: new Set(),
      [Status.NOT_IN_CACHE]: new Set()
    }

    for (const entry of Object.values(statusOutput)) {
      const statuses = this.getChangedOutsStatuses(entry)
      statuses.map(entry => this.collectStatuses(acc, entry))
    }

    return acc
  }

  private mapToTrackedPaths(diff: PathOutput[] = []): string[] {
    return diff
      .map(entry => this.getAbsolutePath(entry.path))
      .filter(path => this.isTracked(path))
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

  private filterStatuses(
    paths: string[],
    filter: (path: string) => boolean
  ): Set<string> {
    return new Set(paths.filter(filter))
  }

  private getAllModifiedAgainstCache(
    modifiedAgainstHead: string[],
    modifiedAgainstCache: Set<string>
  ): Set<string> {
    return new Set<string>([
      ...this.filterStatuses(modifiedAgainstHead, path =>
        this.pathInSet(path, modifiedAgainstCache)
      ),
      ...modifiedAgainstCache
    ])
  }

  private setComplexStatuses(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    const modifiedAgainstHead = collectModifiedAgainstHead(
      this.dvcRoot,
      diffOutput.modified || [],
      this.getTracked()
    )

    const {
      [Status.MODIFIED]: modifiedAgainstCache,
      [Status.NOT_IN_CACHE]: notInCache
    } = this.collectModifiedAndNotInCache(statusOutput)

    this.state.gitModified = this.filterStatuses(modifiedAgainstHead, path =>
      this.pathNotInSet(path, new Set([...notInCache, ...modifiedAgainstCache]))
    )

    this.state.modified = this.getAllModifiedAgainstCache(
      modifiedAgainstHead,
      modifiedAgainstCache
    )

    const deletedWithChildren = collectDeleted(
      this.getStateFromDiff(diffOutput[Status.DELETED]),
      this.getTracked()
    )

    this.state.notInCache = new Set([
      ...this.getStateFromDiff(diffOutput[Status.NOT_IN_CACHE]),
      ...this.filterStatuses(
        [...deletedWithChildren, ...modifiedAgainstHead],
        path => this.pathInSet(path, notInCache)
      )
    ])

    this.state.deleted = new Set(
      [...deletedWithChildren].filter(path => !this.state.notInCache.has(path))
    )
  }

  private updateStatus(
    diffOutput: DiffOutput,
    statusOutput: StatusOutput
  ): void {
    this.state.added = this.getStateFromDiff(diffOutput.added)
    this.state.renamed = new Set(
      diffOutput.renamed
        ?.map(renamed => this.getAbsolutePath(renamed?.path?.new))
        .filter(path => this.isTracked(path))
    )

    this.setComplexStatuses(diffOutput, statusOutput)
  }

  private updateTracked(listOutput: ListOutput[]): void {
    const trackedLeafs = new Set(
      listOutput.map(tracked => join(this.dvcRoot, tracked.path))
    )
    const trackedNonLeafs = collectTrackedNonLeafs(this.dvcRoot, trackedLeafs)

    if (
      !sameContents(
        [...trackedNonLeafs, ...trackedLeafs],
        [...this.getTracked()]
      )
    ) {
      this.state.trackedNonLeafs = trackedNonLeafs
      this.state.trackedLeafs = trackedLeafs
      this.collectTree()
    }
  }

  private getTracked() {
    return new Set([...this.state.trackedNonLeafs, ...this.state.trackedLeafs])
  }

  private isTracked(path: string) {
    return this.getTracked().has(path)
  }

  private collectTree() {
    this.tree = collectTree(
      this.dvcRoot,
      this.state.trackedLeafs,
      this.relTrackedOuts
    )
  }
}
