import { scm, SourceControl, SourceControlResourceGroup, Uri } from 'vscode'
import { PathItem } from './model/collect'
import { Disposable } from '../class/dispose'

export type SourceControlManagementState = {
  committed: ResourceState[]
  uncommitted: ResourceState[]
  untracked: ResourceState[]
  notInCache: ResourceState[]
}

export interface SourceControlManagementModel {
  getSourceControlManagementState: () => SourceControlManagementState
}

export enum Status {
  COMMITTED_ADDED = 'committedAdded',
  COMMITTED_DELETED = 'committedDeleted',
  COMMITTED_MODIFIED = 'committedModified',
  COMMITTED_RENAMED = 'committedRenamed',
  NOT_IN_CACHE = 'notInCache',
  UNCOMMITTED_ADDED = 'uncommittedAdded',
  UNCOMMITTED_DELETED = 'uncommittedDeleted',
  UNCOMMITTED_MODIFIED = 'uncommittedModified',
  UNCOMMITTED_RENAMED = 'uncommittedRenamed',
  UNTRACKED = 'untracked'
}

type ResourceState = PathItem & {
  contextValue: Status
}

export class SourceControlManagement extends Disposable {
  private committedResourceGroup: SourceControlResourceGroup
  private uncommittedResourceGroup: SourceControlResourceGroup
  private untrackedResourceGroup: SourceControlResourceGroup
  private notInCacheResourceGroup: SourceControlResourceGroup

  constructor(dvcRoot: string, state: SourceControlManagementState) {
    super()

    const scmView = this.dispose.track(
      scm.createSourceControl('dvc', 'DVC', Uri.file(dvcRoot))
    )

    scmView.inputBox.visible = false

    this.committedResourceGroup = this.createResourceGroup(
      dvcRoot,
      scmView,
      'committed',
      'Committed'
    )

    this.uncommittedResourceGroup = this.createResourceGroup(
      dvcRoot,
      scmView,
      'uncommitted',
      'Uncommitted'
    )

    this.notInCacheResourceGroup = this.createResourceGroup(
      dvcRoot,
      scmView,
      'notInCache',
      'Not In Cache'
    )

    this.untrackedResourceGroup = this.createResourceGroup(
      dvcRoot,
      scmView,
      'untracked',
      'Untracked'
    )

    this.setState(state)
  }

  public setState(state: SourceControlManagementState) {
    const { committed, uncommitted, untracked, notInCache } = state

    this.committedResourceGroup.resourceStates = committed

    this.notInCacheResourceGroup.resourceStates = notInCache

    this.uncommittedResourceGroup.resourceStates = uncommitted

    this.untrackedResourceGroup.resourceStates = untracked
  }

  private createResourceGroup(
    dvcRoot: string,
    scmView: SourceControl,
    id: string,
    title: string
  ) {
    const resourceGroup = this.dispose.track(
      scmView.createResourceGroup(id, title)
    )

    resourceGroup.hideWhenEmpty = true

    Object.assign(resourceGroup, { rootUri: Uri.file(dvcRoot) })
    return resourceGroup
  }
}
