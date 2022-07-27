import { basename, extname, relative } from 'path'
import { Uri } from 'vscode'
import { collectDataStatus, collectTree, PathItem } from './collect'
import {
  SourceControlManagementModel,
  SourceControlManagementResource,
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

  private hasChanges = false
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
      committed: this.getScmResourceGroup({
        [SourceControlManagementStatus.COMMITTED_ADDED]: this.committedAdded,
        [SourceControlManagementStatus.COMMITTED_DELETED]:
          this.committedDeleted,
        [SourceControlManagementStatus.COMMITTED_MODIFIED]:
          this.committedModified,
        [SourceControlManagementStatus.COMMITTED_RENAMED]: this.committedRenamed
      } as Record<SourceControlManagementStatus, Set<string>>),
      notInCache: this.getScmResources(
        SourceControlManagementStatus.NOT_IN_CACHE,
        this.notInCache
      ),
      uncommitted: this.getScmResourceGroup({
        [SourceControlManagementStatus.UNCOMMITTED_ADDED]:
          this.uncommittedAdded,
        [SourceControlManagementStatus.UNCOMMITTED_DELETED]:
          this.uncommittedDeleted,
        [SourceControlManagementStatus.UNCOMMITTED_MODIFIED]:
          this.uncommittedModified,
        [SourceControlManagementStatus.UNCOMMITTED_RENAMED]:
          this.uncommittedRenamed
      } as Record<SourceControlManagementStatus, Set<string>>),
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
    const tracked = this.collectDataStatus({
      ...dataStatus,
      untracked: [...untracked].map(path => relative(this.dvcRoot, path))
    })
    this.collectTree(tracked)

    this.hasChanges = !!(
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
      hasGitChanges
    )
  }

  public getHasChanges(): boolean {
    return this.hasChanges
  }

  private collectTree(tracked: Set<string>): void {
    if (!sameContents([...tracked], [...this.getTracked()])) {
      this.tracked = tracked
      this.tree = collectTree(this.dvcRoot, this.tracked)
    }
  }

  private collectDataStatus(
    dataStatus: DataStatusOutput & { untracked?: string[] }
  ) {
    const {
      committedAdded,
      committedDeleted,
      committedModified,
      committedRenamed,
      notInCache,
      tracked,
      trackedDecorations,
      uncommittedAdded,
      uncommittedDeleted,
      uncommittedModified,
      uncommittedRenamed,
      untracked
    } = collectDataStatus(this.dvcRoot, dataStatus)

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

    return tracked
  }

  private getTracked() {
    return this.tracked
  }

  private isTracked(path: string) {
    return this.getTracked().has(path)
  }

  private getScmResourceGroup(
    resourceGroupMapping: Record<SourceControlManagementStatus, Set<string>>
  ) {
    const resourceGroup: SourceControlManagementResource[] = []
    for (const [contextValue, paths] of Object.entries(resourceGroupMapping)) {
      resourceGroup.push(
        ...this.getScmResources(
          contextValue as SourceControlManagementStatus,
          paths
        )
      )
    }
    return resourceGroup
  }

  private getScmResources(
    contextValue: SourceControlManagementStatus,
    paths: Set<string>
  ) {
    return [...paths].map(path => this.getScmResource(contextValue, path))
  }

  private getScmResource(
    contextValue: SourceControlManagementStatus,
    path: string
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
