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

  private setWorking = (working: boolean) => {
    if (working) {
      this.statusBarItem.text = '$(loading~spin) DVC'
    } else {
      this.statusBarItem.text = 'DVC'
    }
  }

  private addWorker = () => {
    this.workers = this.workers + 1
    this.setWorking(true)
  }

  private removeWorker = () => {
    this.workers = Math.max(this.workers - 1, 0)
    if (!this.workers) {
      this.setWorking(false)
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
