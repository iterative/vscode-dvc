import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'
import { isStringInEnum } from '../../util'

export type SourceControlManagementState = Record<Status, Set<string>>

enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'notInCache',
  UNTRACKED = 'untracked'
}

enum RemoteOnly {
  NOT_ON_DISK = 'notOnDisk'
}

type ResourceState = { resourceUri: Uri; contextValue: Status | RemoteOnly }
export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  private changedResourceGroup: SourceControlResourceGroup

  @observable
  private remoteOnlyResourceGroup: SourceControlResourceGroup

  public setState(state: SourceControlManagementState) {
    const reduceChangedResourceStates = (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [status, resources] = entry as [RemoteOnly, Set<string>]
      return [
        ...resourceStates,
        ...this.getResourceStates(status, Status, resources)
      ]
    }

    this.changedResourceGroup.resourceStates = Object.entries(state).reduce(
      reduceChangedResourceStates,
      []
    )
    const reduceRemoteOnlyResourceStates = (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [remoteOnly, resources] = entry as [Status, Set<string>]
      return [
        ...resourceStates,
        ...this.getResourceStates(remoteOnly, RemoteOnly, resources)
      ]
    }

    this.remoteOnlyResourceGroup.resourceStates = Object.entries(state).reduce(
      reduceRemoteOnlyResourceStates,
      []
    )
  }

  private isValidStatus(
    s: string,
    E: typeof Status | typeof RemoteOnly
  ): boolean {
    return isStringInEnum(s, E)
  }

  private getResourceStates(
    contextValue: Status | RemoteOnly,
    filter: typeof Status | typeof RemoteOnly,
    paths: Set<string>
  ): ResourceState[] {
    if (!this.isValidStatus(contextValue, filter)) {
      return []
    }
    return [...paths]
      .filter(
        path => extname(path) !== '.dvc' && basename(path) !== '.gitignore'
      )
      .map(path => ({
        resourceUri: Uri.file(path),
        contextValue
      }))
  }

  constructor(repositoryRoot: string, state: SourceControlManagementState) {
    makeObservable(this)

    const scmView = this.dispose.track(
      scm.createSourceControl('dvc', 'DVC', Uri.file(repositoryRoot))
    )

    scmView.inputBox.visible = false

    this.changedResourceGroup = this.dispose.track(
      scmView.createResourceGroup('group1', 'Changes')
    )

    this.remoteOnlyResourceGroup = this.dispose.track(
      scmView.createResourceGroup('group2', 'Available From Storage')
    )

    this.setState(state)
  }
}
