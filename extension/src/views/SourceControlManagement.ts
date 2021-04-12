import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'

interface scmResourceState {
  deleted: Uri[]
  modified: Uri[]
  new: Uri[]
  notInCache: Uri[]
  untracked: Uri[]
}
export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  private resourceGroup: SourceControlResourceGroup

  public setResourceStates(state: scmResourceState) {
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
    uris: Uri[]
  ): { resourceUri: Uri; contextValue: string }[] {
    return uris
      .filter(
        uri =>
          extname(uri.fsPath) !== '.dvc' &&
          basename(uri.fsPath) !== '.gitignore'
      )
      .map(uri => ({
        resourceUri: uri,
        contextValue
      }))
  }

  constructor(repositoryRoot: string, state: scmResourceState) {
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
