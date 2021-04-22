import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'
import { isStringInEnum } from '../../util'

export type SourceControlManagementState = Record<State, Set<string>>

enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'notInCache',
  UNTRACKED = 'untracked'
}

enum RemoteOnly {
  REMOTE_ONLY = 'remoteOnly'
}

type State = Status | RemoteOnly
type StateType = typeof RemoteOnly | typeof Status

type ResourceState = { resourceUri: Uri; contextValue: RemoteOnly | Status }
export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  private changedResourceGroup: SourceControlResourceGroup

  @observable
  private remoteOnlyResourceGroup: SourceControlResourceGroup

  private getResourceStatesReducer(filter: StateType) {
    return (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [resource, resources] = entry as [RemoteOnly | Status, Set<string>]
      return [
        ...resourceStates,
        ...this.getResourceStates(resource, filter, resources)
      ]
    }
  }

  public setState(state: SourceControlManagementState) {
    this.changedResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer(Status),
      []
    )

    this.remoteOnlyResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer(RemoteOnly),
      []
    )
  }

  private isResourceInGroup(resource: string, filter: StateType): boolean {
    return isStringInEnum(resource, filter)
  }

  private getResourceStates(
    contextValue: State,
    filter: StateType,
    paths: Set<string>
  ): ResourceState[] {
    if (!this.isResourceInGroup(contextValue, filter)) {
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
      scmView.createResourceGroup('group2', 'Remote Only')
    )

    this.setState(state)
  }
}
