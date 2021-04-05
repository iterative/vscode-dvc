import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'

export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  resourceGroup: SourceControlResourceGroup

  public updateUntracked(untracked: string[]) {
    if (this.resourceGroup) {
      this.resourceGroup.resourceStates = this.getUntrackedResourceStates(
        untracked
      )
    }
  }

  private getUntrackedResourceStates(
    untracked: string[]
  ): { resourceUri: Uri; contextValue: 'untracked' }[] {
    return untracked
      .filter(
        untracked =>
          extname(untracked) !== '.dvc' && basename(untracked) !== '.gitignore'
      )
      .map(untracked => ({
        resourceUri: Uri.file(untracked),
        contextValue: 'untracked'
      }))
  }

  constructor(repositoryRoot: string, untracked: string[]) {
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

    this.resourceGroup.resourceStates = this.getUntrackedResourceStates(
      untracked
    )
  }
}
