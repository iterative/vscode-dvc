import { basename, extname, relative } from 'path'
import { Uri } from 'vscode'
import omit from 'lodash.omit'
import { collectDataStatus, collectTree, DataStatus, PathItem } from './collect'
import { UndecoratedDataStatus } from '../constants'
import {
  SourceControlDataStatus,
  SourceControlResource,
  SourceControlResourceGroupData,
  SCMState,
  SourceControlStatus
} from '../sourceControlManagement'
import { DataStatusOutput } from '../../cli/reader'
import { Disposable } from '../../class/dispose'
import { sameContents } from '../../util/array'
import { Data } from '../data'
import { isDirectory } from '../../fileSystem'

export class RepositoryModel extends Disposable {
  private readonly dvcRoot: string

  private hasChanges = false

  private tracked = new Set<string>()

  private tree = new Map<string, PathItem[]>()

  constructor(dvcRoot: string) {
    super()

    this.dvcRoot = dvcRoot
  }

  public getScale() {
    return this.tracked.size
  }

  public getChildren(path: string): PathItem[] {
    return this.tree.get(path) || []
  }

  public transformAndSet({ dataStatus, hasGitChanges, untracked }: Data) {
    const data = this.collectDataStatus({
      ...dataStatus,
      untracked: [...untracked].map(path => relative(this.dvcRoot, path))
    })
    this.collectTree(data.tracked)
    this.collectHasChanges(data, hasGitChanges)

    return {
      decorationState: this.getDecorationState(data),
      sourceControlManagementState: this.getSourceControlManagementState(data)
    }
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

  private collectHasChanges(data: DataStatus, hasGitChanges: boolean) {
    this.hasChanges = !!(
      hasGitChanges ||
      data.committedAdded.size > 0 ||
      data.committedDeleted.size > 0 ||
      data.committedModified.size > 0 ||
      data.committedRenamed.size > 0 ||
      data.notInCache.size > 0 ||
      data.uncommittedAdded.size > 0 ||
      data.uncommittedDeleted.size > 0 ||
      data.uncommittedModified.size > 0 ||
      data.uncommittedRenamed.size > 0 ||
      data.untracked.size > 0
    )
  }

  private getDecorationState(data: DataStatus) {
    return {
      ...omit(data, ...Object.values(UndecoratedDataStatus)),
      tracked: data.trackedDecorations
    }
  }

  private getSourceControlManagementState({
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
  }: SourceControlResourceGroupData): SCMState {
    return {
      committed: this.getScmResourceGroup({
        committedAdded,
        committedDeleted,
        committedModified,
        committedRenamed
      } as SourceControlResourceGroupData),
      notInCache: this.getScmResourceGroup({ notInCache } as Record<
        SourceControlStatus,
        Set<string>
      >),
      uncommitted: this.getScmResourceGroup({
        uncommittedAdded,
        uncommittedDeleted,
        uncommittedModified,
        uncommittedRenamed
      } as SourceControlResourceGroupData),
      untracked: [...untracked]
        .filter(
          path => extname(path) !== '.dvc' && basename(path) !== '.gitignore'
        )
        .map(path => ({
          contextValue: SourceControlDataStatus.UNTRACKED,
          dvcRoot: this.dvcRoot,
          isDirectory: isDirectory(path),
          isTracked: false,
          resourceUri: Uri.file(path)
        }))
    }
  }

  private collectDataStatus(
    dataStatus: DataStatusOutput & { untracked?: string[] }
  ) {
    return collectDataStatus(this.dvcRoot, dataStatus)
  }

  private getTracked() {
    return this.tracked
  }

  private isTracked(path: string) {
    return this.getTracked().has(path)
  }

  private getScmResourceGroup(
    resourceGroupMapping: SourceControlResourceGroupData
  ) {
    const resourceGroup: SourceControlResource[] = []
    for (const [contextValue, paths] of Object.entries(resourceGroupMapping)) {
      resourceGroup.push(
        ...this.getScmResources(contextValue as SourceControlStatus, paths)
      )
    }
    return resourceGroup
  }

  private getScmResources(
    contextValue: SourceControlStatus,
    paths: Set<string>
  ) {
    return [...paths].map(path => this.getScmResource(contextValue, path))
  }

  private getScmResource(contextValue: SourceControlStatus, path: string) {
    return {
      contextValue,
      dvcRoot: this.dvcRoot,
      isDirectory: !!this.tree.get(path),
      isTracked: this.isTracked(path),
      resourceUri: Uri.file(path)
    }
  }
}
