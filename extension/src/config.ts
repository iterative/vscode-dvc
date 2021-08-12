import {
  ColorTheme,
  ColorThemeKind,
  EventEmitter,
  Event,
  window,
  workspace
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { WebviewColorTheme } from './experiments/webview/contract'
import {
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath
} from './extensions/python'
import { QuickPickItemWithValue } from './vscode/quickPick'
import { getConfigValue, setConfigValue } from './vscode/config'
import { definedAndNonEmpty } from './util/array'

export class Config {
  @observable
  public pythonBinPath: string | undefined

  @observable
  private vsCodeTheme: ColorTheme

  @observable
  private dvcPath = this.getCliPath()

  public readonly dispose = Disposable.fn()

  public readonly onDidChangeExecutionDetails: Event<void>

  private readonly executionDetailsChanged: EventEmitter<void>

  private dvcRoots: string[] = []

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private dvcPathOption = 'dvc.dvcPath'
  private pythonPathOption = 'dvc.pythonPath'
  private defaultProjectOption = 'dvc.defaultProject'

  constructor() {
    makeObservable(this)

    this.executionDetailsChanged = this.dispose.track(new EventEmitter())
    this.onDidChangeExecutionDetails = this.executionDetailsChanged.event

    this.setPythonBinPath()

    this.onDidChangePythonExecutionDetails()

    this.vsCodeTheme = window.activeColorTheme

    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this.vsCodeTheme = window.activeColorTheme
      })
    )

    this.onDidConfigurationChange()
  }

  public setDvcRoots(dvcRoots: string[]): void {
    this.dvcRoots = dvcRoots
  }

  public isReady() {
    return this.initialized
  }

  public getTheme(): WebviewColorTheme {
    if (this.vsCodeTheme.kind === ColorThemeKind.Dark) {
      return WebviewColorTheme.dark
    }
    return WebviewColorTheme.light
  }

  public getFirstWorkspaceFolderRoot(): string | undefined {
    const { workspaceFolders } = workspace
    return workspaceFolders && workspaceFolders.length > 0
      ? workspaceFolders[0].uri.fsPath
      : undefined
  }

  public getCliPath(): string {
    return getConfigValue(this.dvcPathOption)
  }

  public getDefaultProject(): string {
    return getConfigValue(this.defaultProjectOption)
  }

  public deselectDefaultProject = (): Thenable<void> =>
    this.setDefaultProject(undefined)

  public selectDefaultProject = async (): Promise<void> => {
    const dvcRoot = await this.pickDefaultProject()
    if (dvcRoot) {
      this.setDefaultProject(dvcRoot)
    }
  }

  private async getPythonBinPath() {
    return getConfigValue('dvc.pythonPath') || (await getPythonBinPath())
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

  private getDefaultProjectOptions(
    dvcRoots: string[]
  ): QuickPickItemWithValue[] {
    return [
      {
        description: 'Choose project each time a command is run',
        label: 'Always prompt',
        picked: true,
        value: 'remove-default'
      },
      ...dvcRoots.map(dvcRoot => ({
        description: dvcRoot,
        label: 'Project',
        value: dvcRoot
      }))
    ]
  }

  private async pickDefaultProject(): Promise<string | undefined> {
    if (definedAndNonEmpty(this.dvcRoots)) {
      const selected = await window.showQuickPick(
        this.getDefaultProjectOptions(this.dvcRoots),
        {
          canPickMany: false,
          placeHolder: 'Select a default project to run all commands against'
        }
      )

      if (selected?.value === 'remove-default') {
        this.deselectDefaultProject()
        return
      }

      return selected?.value
    }
  }

  private setDefaultProject(path?: string): Thenable<void> {
    return setConfigValue(this.defaultProjectOption, path)
  }
}
