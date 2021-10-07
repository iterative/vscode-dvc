import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'

export type SourceControlManagementState = Record<Status, Set<string>>

export interface SourceControlManagementModel {
  getState: () => SourceControlManagementState
}

enum Status {
  ADDED = 'added',
  DELETED = 'deleted',
  MODIFIED = 'modified',
  NOT_IN_CACHE = 'notInCache',
  RENAMED = 'renamed',
  GIT_MODIFIED = 'gitModified',
  UNTRACKED = 'untracked'
}

type ResourceState = { resourceUri: Uri; contextValue: Status; dvcRoot: string }

export class SourceControlManagement {
  @observable
  private changedResourceGroup: SourceControlResourceGroup

  @observable
  private gitModifiedResourceGroup: SourceControlResourceGroup

  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string

  constructor(dvcRoot: string, state: SourceControlManagementState) {
    makeObservable(this)

    this.dvcRoot = dvcRoot

    const scmView = this.dispose.track(
      scm.createSourceControl('dvc', 'DVC', Uri.file(dvcRoot))
    )

    scmView.inputBox.visible = false

    this.changedResourceGroup = this.dispose.track(
      scmView.createResourceGroup('changes', 'Changes')
    )

    this.gitModifiedResourceGroup = this.dispose.track(
      scmView.createResourceGroup('gitModified', 'Need Git Commit')
    )

    this.changedResourceGroup.hideWhenEmpty = true
    this.gitModifiedResourceGroup.hideWhenEmpty = true

    this.setState(state)
  }

  public setState(state: SourceControlManagementState) {
    this.changedResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer(
        Object.values(Status).filter(status => status !== Status.GIT_MODIFIED)
      ),
      []
    )

    this.gitModifiedResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer([Status.GIT_MODIFIED]),
      []
    )
  }

  public getState() {
    return this.changedResourceGroup.resourceStates
  }

  private getResourceStatesReducer(validStatuses: Status[]) {
    return (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [status, resources] = entry as [Status, Set<string>]
      return [
        ...resourceStates,
        ...(validStatuses.includes(status)
          ? this.getResourceStates(status, resources)
          : [])
      ]
    }
  }

  private getResourceStates(
    contextValue: Status,
    paths: Set<string>
  ): ResourceState[] {
    return [...paths]
      .filter(
        path => extname(path) !== '.dvc' && basename(path) !== '.gitignore'
      )
      .map(path => {
        return {
          contextValue,
          dvcRoot: this.dvcRoot,
          resourceUri: Uri.file(path)
        }
      })
  }
}
