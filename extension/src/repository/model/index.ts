import { basename, extname, relative } from 'path'
import { Uri } from 'vscode'
import omit from 'lodash.omit'
import {
  collectDataStatus,
  collectTree,
  createDataStatusAccumulator,
  DataStatusAccumulator,
  PathItem
} from './collect'
import { getDecoratableUri } from '../errorDecorationProvider'
import { UndecoratedDataStatus } from '../constants'
import {
  SourceControlDataStatus,
  SourceControlResource,
  SourceControlResourceGroupData,
  SCMState,
  SourceControlStatus
} from '../sourceControlManagement'
import { DataStatusOutput, DvcError, isDvcError } from '../../cli/dvc/reader'
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
    if (isDvcError(dataStatus)) {
      return this.handleError(dataStatus)
    }

    const data = this.collectDataStatus({
      ...dataStatus,
      untracked: [...untracked].map(path => relative(this.dvcRoot, path))
    })
    this.collectTree(data.tracked)
    this.collectHasChanges(data, hasGitChanges)

    return {
      scmDecorationState: this.getScmDecorationState(data),
      sourceControlManagementState: this.getSourceControlManagementState(data)
    }
  }

  public getHasChanges(): boolean {
    return this.hasChanges
  }

  private handleError(dataStatus: DvcError) {
    const emptyState = createDataStatusAccumulator()
    this.hasChanges = true

    this.tracked = new Set()
    const label = dataStatus.error.msg.split('\n')[0].replace(/'|"/g, '')
    this.tree = new Map([
      [
        this.dvcRoot,
        [
          {
            dvcRoot: this.dvcRoot,
            error: {
              msg: dataStatus.error.msg,
              uri: getDecoratableUri(label)
            },
            isDirectory: false,
            isTracked: false,
            resourceUri: Uri.file(this.dvcRoot)
          }
        ]
      ]
    ])

    return {
      errors: new Set([label]),
      scmDecorationState: this.getScmDecorationState(emptyState),
      sourceControlManagementState:
        this.getSourceControlManagementState(emptyState)
    }
  }

  private collectTree(tracked: Set<string>): void {
    if (!sameContents([...tracked], [...this.getTracked()])) {
      this.tracked = tracked
      this.tree = collectTree(this.dvcRoot, this.tracked)
    }
  }

  private collectHasChanges(
    data: DataStatusAccumulator,
    hasGitChanges: boolean
  ) {
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

  private getScmDecorationState(data: DataStatusAccumulator) {
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
    committedUnknown,
    notInCache,
    uncommittedAdded,
    uncommittedDeleted,
    uncommittedModified,
    uncommittedRenamed,
    uncommittedUnknown,
    untracked
  }: SourceControlResourceGroupData): SCMState {
    return {
      committed: this.getScmResourceGroup(
        {
          committedAdded,
          committedDeleted,
          committedModified,
          committedRenamed,
          committedUnknown
        },
        notInCache
      ),
      notInCache: this.getScmResourceGroup({ notInCache }),
      uncommitted: this.getScmResourceGroup(
        {
          uncommittedAdded,
          uncommittedDeleted,
          uncommittedModified,
          uncommittedRenamed,
          uncommittedUnknown
        },
        notInCache
      ),
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
    resourceGroupMapping: Partial<SourceControlResourceGroupData>,
    notInCache?: Set<string>
  ) {
    const resourceGroup: SourceControlResource[] = []
    for (const [contextValue, paths] of Object.entries(resourceGroupMapping)) {
      resourceGroup.push(
        ...this.getScmResources(
          contextValue as SourceControlStatus,
          paths,
          notInCache
        )
      )
    }
    return resourceGroup
  }

  private getScmResources(
    contextValue: SourceControlStatus,
    paths: Set<string>,
    notInCache: Set<string> | undefined
  ) {
    return [...paths].map(path =>
      this.getScmResource(
        notInCache?.has(path)
          ? SourceControlDataStatus.NOT_IN_CACHE
          : contextValue,
        path
      )
    )
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
