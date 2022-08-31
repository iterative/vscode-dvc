import { scm, SourceControl, SourceControlResourceGroup, Uri } from 'vscode'
import { BaseDataStatus } from './constants'
import { PathItem } from './model/collect'
import { Disposable } from '../class/dispose'

export type SCMState = {
  committed: SourceControlResource[]
  uncommitted: SourceControlResource[]
  untracked: SourceControlResource[]
  notInCache: SourceControlResource[]
}

export const SourceControlDataStatus = Object.assign({}, BaseDataStatus, {
  UNTRACKED: 'untracked'
} as const)

export type SourceControlStatus =
  typeof SourceControlDataStatus[keyof typeof SourceControlDataStatus]

export type SourceControlResource = PathItem & {
  contextValue: SourceControlStatus
}

export type SourceControlResourceGroupData = Record<
  SourceControlStatus,
  Set<string>
>

export class SourceControlManagement extends Disposable {
  private committedResourceGroup: SourceControlResourceGroup
  private uncommittedResourceGroup: SourceControlResourceGroup
  private untrackedResourceGroup: SourceControlResourceGroup
  private notInCacheResourceGroup: SourceControlResourceGroup

  constructor(dvcRoot: string, state: SCMState) {
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

  public setState(state: SCMState) {
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
