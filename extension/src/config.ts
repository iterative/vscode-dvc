import { Disposable } from '@hediet/std/disposable'
import { EventEmitter, Event, workspace } from 'vscode'
import {
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath
} from './extensions/python'
import { ConfigKey, getConfigValue } from './vscode/config'
import { DeferredDisposable } from './class/deferred'
import { getOnDidChangeExtensions } from './vscode/extensions'

export class Config extends DeferredDisposable {
  public readonly onDidChangeExecutionDetails: Event<void>

  private pythonBinPath: string | undefined

  private dvcPath = this.getCliPath()

  private readonly executionDetailsChanged: EventEmitter<void>

  private pythonExecutionDetailsListener?: Disposable
  private readonly onDidChangeExtensionsEvent: Event<void>

  constructor(onDidChangeExtensionsEvent = getOnDidChangeExtensions()) {
    super()

    this.executionDetailsChanged = this.dispose.track(new EventEmitter())
    this.onDidChangeExecutionDetails = this.executionDetailsChanged.event
    this.onDidChangeExtensionsEvent = onDidChangeExtensionsEvent

    this.setPythonBinPath()

    this.onDidChangePythonExecutionDetails()
    this.onDidChangeExtensions()

    this.onDidConfigurationChange()
  }

  public getCliPath(): string {
    return getConfigValue(ConfigKey.DVC_PATH)
  }

  public getPythonBinPath() {
    return this.pythonBinPath
  }

  public async setPythonBinPath() {
    this.pythonBinPath = await this.getConfigOrExtensionPythonBinPath()
    return this.deferred.resolve()
  }

  public unsetPythonBinPath() {
    this.pythonBinPath = undefined
  }

  public isPythonExtensionUsed() {
    return !getConfigValue(ConfigKey.PYTHON_PATH) && !!this.pythonBinPath
  }

  private async getConfigOrExtensionPythonBinPath() {
    return getConfigValue(ConfigKey.PYTHON_PATH) || (await getPythonBinPath())
  }

  private async onDidChangePythonExecutionDetails() {
    this.pythonExecutionDetailsListener?.dispose()
    const onDidChangePythonExecutionDetails =
      await getOnDidChangePythonExecutionDetails()
    this.pythonExecutionDetailsListener = this.dispose.track(
      onDidChangePythonExecutionDetails?.(() => {
        this.setPythonAndNotifyIfChanged()
      })
    )
  }

  private onDidChangeExtensions() {
    this.dispose.track(
      this.onDidChangeExtensionsEvent(() => {
        this.onDidChangePythonExecutionDetails()
        this.setPythonAndNotifyIfChanged()
      })
    )
  }

  private onDidConfigurationChange() {
    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(ConfigKey.DVC_PATH)) {
          const oldPath = this.dvcPath
          this.dvcPath = this.getCliPath()
          this.notifyIfChanged(oldPath, this.dvcPath)
        }
        if (e.affectsConfiguration(ConfigKey.PYTHON_PATH)) {
          this.setPythonAndNotifyIfChanged()
        }
      })
    )
  }

  private async setPythonAndNotifyIfChanged() {
    const oldPath = this.pythonBinPath
    this.pythonBinPath = await this.getConfigOrExtensionPythonBinPath()
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
