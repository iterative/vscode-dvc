import { StatusBarItem, window } from 'vscode'
import { BaseClass } from './class'
import { ICli } from './cli'
import { RegisteredCommands } from './commands/external'
import { Title } from './vscode/title'

export class Status extends BaseClass {
  private readonly statusBarItem: StatusBarItem = this.dispose.track(
    window.createStatusBarItem()
  )

  private workers = 0
  private available = false

  constructor(cliInteractors: ICli[]) {
    super()

    this.statusBarItem.text = this.getText(false)
    this.statusBarItem.show()
    this.statusBarItem.tooltip = 'DVC Extension Status'

    for (const cli of cliInteractors) {
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
    }
  }

  public setAvailability = (available: boolean) => {
    this.available = available
    this.setState(!!this.workers)
  }

  private getText = (isWorking: boolean) => {
    if (!this.available) {
      return '$(circle-slash) DVC'
    }
    if (isWorking) {
      return '$(loading~spin) DVC'
    }
    return '$(circle-large-outline) DVC'
  }

  private setState = (isWorking: boolean) => {
    this.statusBarItem.text = this.getText(isWorking)
    this.statusBarItem.command = this.getCommand()
  }

  private addWorker = () => {
    this.workers = this.workers + 1
    this.setState(true)
  }

  private removeWorker = () => {
    this.workers = Math.max(this.workers - 1, 0)
    if (!this.workers) {
      this.setState(false)
    }
  }

  private getCommand() {
    if (this.available) {
      return
    }
    return {
      command: RegisteredCommands.EXTENSION_SETUP_WORKSPACE,
      title: Title.SETUP_WORKSPACE
    }
  }
}
