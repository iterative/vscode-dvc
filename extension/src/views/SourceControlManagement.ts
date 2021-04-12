import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup, Uri } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'

export class SourceControlManagement {
  public readonly dispose = Disposable.fn()

  @observable
  private resourceGroup: SourceControlResourceGroup

  @observable
  private untracked: { resourceUri: Uri; contextValue: 'untracked' }[] = []

  @observable
  private modified: { resourceUri: Uri; contextValue: 'modified' }[] = []

  private setResourceStates() {
    this.resourceGroup.resourceStates = [...this.untracked, ...this.modified]
  }

  public setUntracked(untracked: Uri[]) {
    this.untracked = this.getUntrackedResourceStates(untracked)
    this.setResourceStates()
  }

  private getUntrackedResourceStates(
    untracked: Uri[]
  ): { resourceUri: Uri; contextValue: 'untracked' }[] {
    return untracked
      .filter(
        untracked =>
          extname(untracked.fsPath) !== '.dvc' &&
          basename(untracked.fsPath) !== '.gitignore'
      )
      .map(untracked => ({
        resourceUri: untracked,
        contextValue: 'untracked'
      }))
  }

  constructor(
    repositoryRoot: string,
    { modified, untracked }: Record<string, Uri[]>
  ) {
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

    this.untracked = this.getUntrackedResourceStates(untracked)
    this.modified = modified.map(uri => ({
      resourceUri: uri,
      contextValue: 'modified'
    }))

    this.setResourceStates()
  }
}
