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
    this.setState(!!this.workers)
  }

  private getText(isWorking: boolean, envIndicator?: string) {
    const suffix = envIndicator ? `DVC ${envIndicator}` : 'DVC'

    if (!this.available) {
      return `$(circle-slash) ${suffix}`
    }
    if (isWorking) {
      return `$(loading~spin) ${suffix}`
    }
    return `$(circle-large-outline) ${suffix}`
  }

  private setState(isWorking: boolean) {
    const { indicator, tooltip } = this.getEnvDetails()
    this.statusBarItem.text = this.getText(isWorking, indicator)
    this.statusBarItem.tooltip = tooltip

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
    if (this.workers) {
      return
    }

    return {
      command: RegisteredCommands.SETUP_SHOW_DVC,
      title: Title.SHOW_SETUP
    }
  }

  private getEnvDetails() {
    const dvcPath = this.config.getCliPath()
    const pythonBinPath = this.config.getPythonBinPath()
    if (dvcPath || !pythonBinPath) {
      return {
        indicator: '(Global)',
        tooltip: `Locate DVC at: ${dvcPath || 'dvc'}`
      }
    }

    if (this.config.isPythonExtensionUsed()) {
      return {
        indicator: '(Auto)',
        tooltip: `Locate DVC in the Python environment selected by the Python extension: ${pythonBinPath}`
      }
    }

    return {
      indicator: '(Manual)',
      tooltip: `Locate DVC in this Python environment: ${pythonBinPath}`
    }
  }
}
