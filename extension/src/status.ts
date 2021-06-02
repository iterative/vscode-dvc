import { Disposable } from '@hediet/std/disposable'
import { StatusBarItem, window } from 'vscode'
import { Cli } from './cli'
import { CliRunner } from './cli/runner'

export class Status {
  public dispose = Disposable.fn()

  private statusBarItem: StatusBarItem = this.dispose.track(
    window.createStatusBarItem()
  )

  private workers = 0

  public setAvailability = (available: boolean) => {
    if (available) {
      this.statusBarItem.show()
    } else {
      this.statusBarItem.hide()
    }
  }

  private getText = (isWorking: boolean) => {
    if (isWorking) {
      return '$(loading~spin) DVC'
    }
    return 'DVC'
  }

  private setStatusText = (isWorking: boolean) => {
    this.statusBarItem.text = this.getText(isWorking)
  }

  private addWorker = () => {
    this.workers = this.workers + 1
    this.setStatusText(true)
  }

  private removeWorker = () => {
    this.workers = Math.max(this.workers - 1, 0)
    if (!this.workers) {
      this.setStatusText(false)
    }
  }

  constructor(cliInteractors: (Cli | CliRunner)[]) {
    this.statusBarItem.text = 'DVC'
    this.statusBarItem.tooltip = 'DVC Extension Status'

    cliInteractors.forEach(cli => {
      this.dispose.track(
        cli.onDidStartProcess(() => {
          this.addWorker()
        })
      )

      this.dispose.track(
        cli.onDidCompleteProcess(() => {
          this.removeWorker()
        })
      )
    })
  }
}
