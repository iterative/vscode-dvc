import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { isStringInEnum } from '../util'

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
      scmView.createResourceGroup('group1', 'Changes')
    )

    this.setState(state)
  }

  public setState(state: SourceControlManagementState) {
    this.changedResourceGroup.resourceStates = Object.entries(state).reduce(
      this.getResourceStatesReducer(),
      []
    )
  }

  public getState() {
    return this.changedResourceGroup.resourceStates
  }

  private getResourceStatesReducer() {
    return (
      resourceStates: ResourceState[],
      entry: [string, Set<string>]
    ): ResourceState[] => {
      const [status, resources] = entry as [Status, Set<string>]
      return [...resourceStates, ...this.getResourceStates(status, resources)]
    }
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
        contextValue,
        dvcRoot: this.dvcRoot,
        resourceUri: Uri.file(path)
      }))
  }
}
