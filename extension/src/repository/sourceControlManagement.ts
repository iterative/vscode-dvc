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
  STAGE_MODIFIED = 'stageModified',
  UNTRACKED = 'untracked'
}

type ResourceState = { resourceUri: Uri; contextValue: Status; dvcRoot: string }

export class SourceControlManagement {
  @observable
  private changedResourceGroup: SourceControlResourceGroup

  @observable
  private indexResourceGroup: SourceControlResourceGroup

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
      scmView.createResourceGroup('workingTree', 'Changes')
    )

    this.indexResourceGroup = this.dispose.track(
      scmView.createResourceGroup('index', 'Staged Changes')
    )

    this.changedResourceGroup.hideWhenEmpty = true
    this.indexResourceGroup.hideWhenEmpty = true

    this.setState(state)
  }

  public setState(state: SourceControlManagementState) {
    this.changedResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer(
        Object.values(Status).filter(status => status !== Status.STAGE_MODIFIED)
      ),
      []
    )

    this.indexResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer([Status.STAGE_MODIFIED]),
      []
    )
  }

  public getState() {
    return this.changedResourceGroup.resourceStates
  }

  private getResourceStatesReducer(statuses: Status[]) {
    return (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [status, resources] = entry as [Status, Set<string>]
      return [
        ...resourceStates,
        ...this.getResourceStates(status, resources, statuses)
      ]
    }
  }

  private getResourceStates(
    contextValue: Status,
    paths: Set<string>,
    statuses: Status[]
  ): ResourceState[] {
    if (!statuses.includes(contextValue)) {
      return []
    }
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
