import { StatusBarItem, ThemeColor, window } from 'vscode'
import { Disposable } from './class/dispose'
import { ICli } from './cli'
import { RegisteredCommands } from './commands/external'
import { Title } from './vscode/title'
import { Config } from './config'

export class Status extends Disposable {
  private readonly statusBarItem: StatusBarItem = this.dispose.track(
    window.createStatusBarItem()
  )

  private readonly config: Config

  private workers = 0
  private available = false
  private textSuffix = 'DVC'

  constructor(config: Config, ...cliInteractors: ICli[]) {
    super()

    this.statusBarItem.text = this.getText(false)
    this.statusBarItem.show()
    this.statusBarItem.tooltip = 'DVC Extension Status'

    this.config = config

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

  public async setAvailability(available: boolean) {
    this.available = available
    await this.config.isReady()
    const { text, tooltip } = this.getEnvDetails()

    this.textSuffix = text ? `DVC ${text}` : 'DVC'

    this.statusBarItem.tooltip = tooltip
    this.setState(!!this.workers)
  }

  private getText(isWorking: boolean) {
    if (!this.available) {
      return `$(circle-slash) ${this.textSuffix}`
    }
    if (isWorking) {
      return `$(loading~spin) ${this.textSuffix}`
    }
    return `$(circle-large-outline) ${this.textSuffix}`
  }

  private setState(isWorking: boolean) {
    this.statusBarItem.text = this.getText(isWorking)
    this.statusBarItem.color = this.getColor()

    this.statusBarItem.command = this.getCommand()
  }

  private addWorker() {
    this.workers = this.workers + 1
    this.setState(true)
  }

  private removeWorker() {
    this.workers = Math.max(this.workers - 1, 0)
    if (!this.workers) {
      this.setState(false)
    }
  }

  private getColor() {
    if (this.available) {
      return
    }
    return new ThemeColor('errorForeground')
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

  private getEnvDetails() {
    const dvcPath = this.config.getCliPath()
    if (dvcPath) {
      return { text: '(Global)', tooltip: dvcPath }
    }

    if (this.config.isPythonExtensionUsed()) {
      return { text: '(Auto)', tooltip: 'Interpreter set by Python extension' }
    }

    const pythonBinPath = this.config.getPythonBinPath()
    if (pythonBinPath) {
      return { text: '(Manual)', tooltip: pythonBinPath }
    }

    return { text: '(Global)', tooltip: 'dvc' }
  }
}
