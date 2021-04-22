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
  REMOTE_ONLY = 'remoteOnly',
  UNTRACKED = 'untracked'
}

type ResourceState = { resourceUri: Uri; contextValue: Status }
export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  private changedResourceGroup: SourceControlResourceGroup

  private getResourceStatesReducer() {
    return (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [resource, resources] = entry as [Status, Set<string>]
      return [...resourceStates, ...this.getResourceStates(resource, resources)]
    }
  }

  public setState(state: SourceControlManagementState) {
    this.changedResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer(),
      []
    )
  }

  private isValidStatus(resource: string): boolean {
    return isStringInEnum(resource, Status)
  }

  private getResourceStates(
    contextValue: Status,
    paths: Set<string>
  ): ResourceState[] {
    if (!this.isValidStatus(contextValue)) {
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

    this.setState(state)
  }
}
