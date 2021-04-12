import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'

export interface SourceControlManagementState {
  deleted: Set<string>
  modified: Set<string>
  new: Set<string>
  notInCache: Set<string>
  untracked: Set<string>
}
export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  private resourceGroup: SourceControlResourceGroup

  public setResourceStates(state: SourceControlManagementState) {
    this.resourceGroup.resourceStates = [
      ...this.getResourceStates('deleted', state.deleted),
      ...this.getResourceStates('modified', state.modified),
      ...this.getResourceStates('new', state.new),
      ...this.getResourceStates('notInCache', state.notInCache),
      ...this.getResourceStates('untracked', state.untracked)
    ]
  }

  private getResourceStates(
    contextValue: string,
    paths: Set<string>
  ): { resourceUri: Uri; contextValue: string }[] {
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

    this.setResourceStates(state)
  }
}
