import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'
import { isStringInEnum } from '../util'

export type SourceControlManagementState = Record<Status, Set<string>>

enum Status {
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NEW = 'new',
  NOT_IN_CACHE = 'notInCache',
  UNTRACKED = 'untracked',
  TRACKED = 'tracked'
}

type ResourceState = { resourceUri: Uri; contextValue: Status }
export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  private resourceGroup: SourceControlResourceGroup

  public setState(state: SourceControlManagementState) {
    const reduceResourceStates = (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [status, resources] = entry as [Status, Set<string>]
      return [...resourceStates, ...this.getResourceStates(status, resources)]
    }

    this.resourceGroup.resourceStates = Object.entries(state).reduce(
      reduceResourceStates,
      []
    )
  }

  private isValidStatus(status: string): boolean {
    return isStringInEnum(status, Status)
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
    scmView.acceptInputCommand = {
      command: 'workbench.action.output.toggleOutput',
      title: 'foo'
    }

    scmView.inputBox.visible = false

    this.resourceGroup = this.dispose.track(
      scmView.createResourceGroup('group1', 'Changes')
    )

    this.setState(state)
  }
}
