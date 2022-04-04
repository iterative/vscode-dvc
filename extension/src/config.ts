import { EventEmitter, Event, workspace } from 'vscode'
import {
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath
} from './extensions/python'
import { getConfigValue } from './vscode/config'
import { DeferredDisposable } from './class/deferred'

export class Config extends DeferredDisposable {
  public readonly onDidChangeExecutionDetails: Event<void>

  public pythonBinPath: string | undefined

  private dvcPath = this.getCliPath()

  private readonly executionDetailsChanged: EventEmitter<void>

  private readonly dvcPathOption = 'dvc.dvcPath'
  private readonly pythonPathOption = 'dvc.pythonPath'

  constructor() {
    super()

    this.executionDetailsChanged = this.dispose.track(new EventEmitter())
    this.onDidChangeExecutionDetails = this.executionDetailsChanged.event

    this.setPythonBinPath()

    this.onDidChangePythonExecutionDetails()

    this.onDidConfigurationChange()
  }

  public getCliPath(): string {
    return getConfigValue(this.dvcPathOption)
  }

  public isPythonExtensionUsed() {
    return !getConfigValue(this.pythonPathOption) && !!this.pythonBinPath
  }

  private async getPythonBinPath() {
    return getConfigValue(this.pythonPathOption) || (await getPythonBinPath())
  }

  private async setPythonBinPath() {
    this.pythonBinPath = await this.getPythonBinPath()
    return this.deferred.resolve()
  }

  private async onDidChangePythonExecutionDetails() {
    const onDidChangePythonExecutionDetails =
      await getOnDidChangePythonExecutionDetails()
    this.dispose.track(
      onDidChangePythonExecutionDetails?.(() => {
        this.setPythonAndNotifyIfChanged()
      })
    )
  }

  private onDidConfigurationChange() {
    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(this.dvcPathOption)) {
          const oldPath = this.dvcPath
          this.dvcPath = this.getCliPath()
          this.notifyIfChanged(oldPath, this.dvcPath)
        }
        if (e.affectsConfiguration(this.pythonPathOption)) {
          this.setPythonAndNotifyIfChanged()
        }
      })
    )
  }

  private async setPythonAndNotifyIfChanged() {
    const oldPath = this.pythonBinPath
    this.pythonBinPath = await this.getPythonBinPath()
    this.notifyIfChanged(oldPath, this.pythonBinPath)
  }

  private notifyIfChanged(
    oldPath: string | undefined,
    newPath: string | undefined
  ) {
    if (oldPath !== newPath) {
      this.executionDetailsChanged.fire()
    }
  }
}
