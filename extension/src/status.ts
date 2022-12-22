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
    if (this.available) {
      return
    }
    return {
      command: RegisteredCommands.SETUP_SHOW,
      title: Title.SHOW_SETUP
    }
  }

  private getEnvDetails() {
    const dvcPath = this.config.getCliPath()
    if (dvcPath) {
      return { indicator: '(Global)', tooltip: dvcPath }
    }

    if (this.config.isPythonExtensionUsed()) {
      return {
        indicator: '(Auto)',
        tooltip: 'Interpreter set by Python extension'
      }
    }

    const pythonBinPath = this.config.getPythonBinPath()
    if (pythonBinPath) {
      return { indicator: '(Manual)', tooltip: pythonBinPath }
    }

    return { indicator: '(Global)', tooltip: 'dvc' }
  }
}
