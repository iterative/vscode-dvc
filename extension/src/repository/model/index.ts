import { basename, extname, relative } from 'path'
import { Uri } from 'vscode'
import { collectState, collectTracked, collectTree, PathItem } from './collect'
import {
  SourceControlManagementModel,
  SourceControlManagementState,
  SourceControlManagementStatus
} from '../sourceControlManagement'
import { DecorationModel, DecorationState } from '../decorationProvider'
import { DataStatusOutput } from '../../cli/reader'
import { Disposable } from '../../class/dispose'
import { sameContents } from '../../util/array'
import { Data } from '../data'
import { isDirectory } from '../../fileSystem'

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
  private trackedDecorations = new Set<string>()

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
      tracked: this.trackedDecorations,
      uncommittedAdded: this.uncommittedAdded,
      uncommittedDeleted: this.uncommittedDeleted,
      uncommittedModified: this.uncommittedModified,
      uncommittedRenamed: this.uncommittedRenamed
    }
  }

  public getSourceControlManagementState(): SourceControlManagementState {
    return {
      committed: [
        ...this.getScmResources(
          this.committedAdded,
          SourceControlManagementStatus.COMMITTED_ADDED
        ),
        ...this.getScmResources(
          this.committedDeleted,
          SourceControlManagementStatus.COMMITTED_DELETED
        ),
        ...this.getScmResources(
          this.committedModified,
          SourceControlManagementStatus.COMMITTED_MODIFIED
        ),
        ...this.getScmResources(
          this.committedRenamed,
          SourceControlManagementStatus.COMMITTED_RENAMED
        )
      ],
      notInCache: this.getScmResources(
        this.notInCache,
        SourceControlManagementStatus.NOT_IN_CACHE
      ),
      uncommitted: [
        ...this.getScmResources(
          this.uncommittedAdded,
          SourceControlManagementStatus.UNCOMMITTED_ADDED
        ),
        ...this.getScmResources(
          this.uncommittedDeleted,
          SourceControlManagementStatus.UNCOMMITTED_DELETED
        ),
        ...this.getScmResources(
          this.uncommittedModified,
          SourceControlManagementStatus.UNCOMMITTED_MODIFIED
        ),
        ...this.getScmResources(
          this.uncommittedRenamed,
          SourceControlManagementStatus.UNCOMMITTED_RENAMED
        )
      ],
      untracked: [...this.untracked]
        .filter(
          path => extname(path) !== '.dvc' && basename(path) !== '.gitignore'
        )
        .map(path => ({
          contextValue: SourceControlManagementStatus.UNTRACKED,
          dvcRoot: this.dvcRoot,
          isDirectory: isDirectory(path),
          isTracked: false,
          resourceUri: Uri.file(path)
        }))
    }
  }

  public getChildren(path: string): PathItem[] {
    return this.tree.get(path) || []
  }

  public setState({ dataStatus, hasGitChanges, untracked }: Data) {
    this.collectTracked(dataStatus)

    this.collectState({
      ...dataStatus,
      untracked: [...untracked].map(path => relative(this.dvcRoot, path))
    })

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

  private collectState(
    dataStatus: DataStatusOutput & { untracked?: string[] }
  ) {
    const {
      committedAdded,
      committedDeleted,
      committedModified,
      committedRenamed,
      notInCache,
      trackedDecorations,
      uncommittedAdded,
      uncommittedDeleted,
      uncommittedModified,
      uncommittedRenamed,
      untracked
    } = collectState(this.dvcRoot, dataStatus)

    this.committedAdded = committedAdded
    this.committedDeleted = committedDeleted
    this.committedModified = committedModified
    this.committedRenamed = committedRenamed
    this.notInCache = notInCache
    this.trackedDecorations = trackedDecorations
    this.uncommittedAdded = uncommittedAdded
    this.uncommittedDeleted = uncommittedDeleted
    this.uncommittedModified = uncommittedModified
    this.uncommittedRenamed = uncommittedRenamed
    this.untracked = untracked
  }

  private getTracked() {
    return this.tracked
  }

  private isTracked(path: string) {
    return this.getTracked().has(path)
  }

  private getScmResources(
    paths: Set<string>,
    contextValue: SourceControlManagementStatus
  ) {
    return [...paths].map(path => this.getScmResource(path, contextValue))
  }

  private getScmResource(
    path: string,
    contextValue: SourceControlManagementStatus
  ) {
    return {
      contextValue,
      dvcRoot: this.dvcRoot,
      isDirectory: !!this.tree.get(path),
      isTracked: this.isTracked(path),
      resourceUri: Uri.file(path)
    }
  }
}
