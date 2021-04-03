import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'

export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  resourceGroup: SourceControlResourceGroup

  updateUntracked(untracked: string[]) {
    if (this.resourceGroup) {
      this.resourceGroup.resourceStates = untracked.map(u => ({
        resourceUri: Uri.file(u),
        contextValue: 'untracked'
      }))
    }
  }

  constructor(repositoryRoot: string, untracked: string[]) {
    makeObservable(this)

    const c = this.dispose.track(
      scm.createSourceControl('dvc', 'DVC', Uri.file(repositoryRoot))
    )
    c.acceptInputCommand = {
      command: 'workbench.action.output.toggleOutput',
      title: 'foo'
    }

    c.inputBox.visible = false

    c.statusBarCommands = [
      {
        command: 'test',
        title: 'DVC'
      }
    ]

    this.resourceGroup = this.dispose.track(
      c.createResourceGroup('group1', 'Changes')
    )

    this.resourceGroup.resourceStates = untracked.map(change => ({
      resourceUri: Uri.file(change),
      contextValue: 'untracked'
    }))
  }
}
