import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'

export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  resourceGroup: SourceControlResourceGroup

  updateUntracked(untracked: Uri[]) {
    if (this.resourceGroup) {
      this.resourceGroup.resourceStates = untracked.map(u => ({
        resourceUri: u,
        contextValue: 'untracked'
      }))
    }
  }

  constructor(repositoryRoot: string, untracked: Uri[]) {
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

    this.resourceGroup.resourceStates = untracked.map(change => ({
      resourceUri: change,
      contextValue: 'untracked'
    }))
  }
}
