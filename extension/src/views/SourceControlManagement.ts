import { Disposable } from '@hediet/std/disposable'
import { scm, SourceControlResourceGroup } from 'vscode'
import { URI } from 'vscode-uri'
import { makeObservable, observable } from 'mobx'
import { basename, extname } from 'path'
import { Status } from '../Status'

export class SourceControlManagement {
  public readonly dispose = Disposable.fn()
  public readonly status: Status

  @observable
  private resourceGroup: SourceControlResourceGroup

  @observable
  private untracked: { resourceUri: URI; contextValue: 'untracked' }[] = []

  @observable
  private modified: { resourceUri: URI; contextValue: 'modified' }[] = []

  private setResourceStates() {
    this.resourceGroup.resourceStates = [...this.untracked, ...this.modified]
  }

  public setUntracked(untracked: URI[]) {
    this.untracked = this.getUntrackedResourceStates(untracked)
    this.setResourceStates()
  }

  private getUntrackedResourceStates(
    untracked: URI[]
  ): { resourceUri: URI; contextValue: 'untracked' }[] {
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

  constructor(repositoryRoot: string, untracked: URI[], status: Status) {
    makeObservable(this)

    this.status = status

    const scmView = this.dispose.track(
      scm.createSourceControl('dvc', 'DVC', URI.file(repositoryRoot))
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

    this.status.ready.then(() => {
      this.modified = this.status.modified.map(uri => ({
        resourceUri: uri,
        contextValue: 'modified'
      }))
      this.setResourceStates()
    })
  }
}
