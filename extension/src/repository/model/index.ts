import { basename, extname } from 'path'
import { Uri } from 'vscode'
import {
  collectDecorationState,
  collectTracked,
  collectTrackedDecorations,
  collectTree,
  PathItem
} from './collect'
import {
  SourceControlManagementModel,
  SourceControlManagementState,
  Status
} from '../sourceControlManagement'
import { DecorationModel, DecorationState } from '../decorationProvider'
import { DataStatusOutput } from '../../cli/reader'
import { Disposable } from '../../class/dispose'
import { sameContents } from '../../util/array'
import { Data } from '../data'

export class RepositoryModel
  extends Disposable
  implements DecorationModel, SourceControlManagementModel
{
  private readonly dvcRoot: string

  private hasGitChanges = false
  private committedAdded = new Set<string>()
  private committedDeleted = new Set<string>()
  private committedModified = new Set<string>()
  private committedRenamed = new Set<string>()
  private notInCache = new Set<string>()
  private uncommittedAdded = new Set<string>()
  private uncommittedDeleted = new Set<string>()
  private uncommittedModified = new Set<string>()
  private uncommittedRenamed = new Set<string>()
  private untracked = new Set<string>()

  private tracked = new Set<string>()

  private tree = new Map<string, PathItem[]>()

  constructor(dvcRoot: string) {
    super()

    this.dvcRoot = dvcRoot
  }

  public getDecorationState(): DecorationState {
    return {
      committedAdded: this.committedAdded,
      committedDeleted: this.committedDeleted,
      committedModified: this.committedModified,
      committedRenamed: this.committedRenamed,
      notInCache: this.notInCache,
      tracked: this.getTrackedDecorations(),
      uncommittedAdded: this.uncommittedAdded,
      uncommittedDeleted: this.uncommittedDeleted,
      uncommittedModified: this.uncommittedModified,
      uncommittedRenamed: this.uncommittedRenamed
    }
  }

  public getSourceControlManagementState(): SourceControlManagementState {
    return {
      committed: [
        ...this.getResourceStates(this.committedAdded, Status.COMMITTED_ADDED),
        ...this.getResourceStates(
          this.committedDeleted,
          Status.COMMITTED_DELETED
        ),
        ...this.getResourceStates(
          this.committedModified,
          Status.COMMITTED_MODIFIED
        ),
        ...this.getResourceStates(
          this.committedRenamed,
          Status.COMMITTED_RENAMED
        )
      ],
      notInCache: this.getResourceStates(this.notInCache, Status.NOT_IN_CACHE),
      uncommitted: [
        ...this.getResourceStates(
          this.uncommittedAdded,
          Status.UNCOMMITTED_ADDED
        ),
        ...this.getResourceStates(
          this.uncommittedDeleted,
          Status.UNCOMMITTED_DELETED
        ),
        ...this.getResourceStates(
          this.uncommittedModified,
          Status.UNCOMMITTED_MODIFIED
        ),
        ...this.getResourceStates(
          this.uncommittedRenamed,
          Status.UNCOMMITTED_RENAMED
        )
      ],
      untracked: this.getResourceStates(this.untracked, Status.UNTRACKED)
    }
  }

  public getChildren(path: string): PathItem[] {
    return this.tree.get(path) || []
  }

  public setState({ dataStatus, hasGitChanges }: Data) {
    this.collectTracked(dataStatus)

    this.collectState(dataStatus)

    this.hasGitChanges = hasGitChanges
  }

  public hasChanges(): boolean {
    return !!(
      this.committedAdded.size > 0 ||
      this.committedDeleted.size > 0 ||
      this.committedModified.size > 0 ||
      this.committedRenamed.size > 0 ||
      this.notInCache.size > 0 ||
      this.uncommittedAdded.size > 0 ||
      this.uncommittedDeleted.size > 0 ||
      this.uncommittedModified.size > 0 ||
      this.uncommittedRenamed.size > 0 ||
      this.untracked.size > 0 ||
      this.hasGitChanges
    )
  }

  private collectTracked(dataStatus: DataStatusOutput): void {
    const tracked = collectTracked(this.dvcRoot, dataStatus)

    if (!sameContents([...tracked], [...this.getTracked()])) {
      this.tracked = tracked
      this.tree = collectTree(this.dvcRoot, this.tracked)
    }
  }

  private collectState(dataStatus: DataStatusOutput) {
    const {
      committedAdded,
      committedDeleted,
      committedModified,
      committedRenamed,
      notInCache,
      uncommittedAdded,
      uncommittedDeleted,
      uncommittedModified,
      uncommittedRenamed,
      untracked
    } = collectDecorationState(this.dvcRoot, dataStatus)

    this.committedAdded = committedAdded
    this.committedDeleted = committedDeleted
    this.committedModified = committedModified
    this.committedRenamed = committedRenamed
    this.notInCache = notInCache
    this.uncommittedAdded = uncommittedAdded
    this.uncommittedDeleted = uncommittedDeleted
    this.uncommittedModified = uncommittedModified
    this.uncommittedRenamed = uncommittedRenamed
    this.untracked = untracked
  }

  private getTracked() {
    return this.tracked
  }

  private getTrackedDecorations() {
    return collectTrackedDecorations(this.tracked)
  }

  private isTracked(path: string) {
    return this.getTracked().has(path)
  }

  private getResourceStates(paths: Set<string>, contextValue: Status) {
    return [...paths]
      .filter(
        path => extname(path) !== '.dvc' && basename(path) !== '.gitignore'
      )
      .map(path => this.getResourceState(path, contextValue))
  }

  private getResourceState(path: string, contextValue: Status) {
    return {
      contextValue,
      dvcRoot: this.dvcRoot,
      isDirectory: !!this.tree.get(path), // these are needed because commands operate on both the SCM and Tracked Tree
      isTracked: this.isTracked(path),
      resourceUri: Uri.file(path)
    }
  }
}
