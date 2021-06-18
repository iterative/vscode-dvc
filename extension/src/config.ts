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

  public readonly dispose = Disposable.fn()

  public readonly onDidChangeExecutionDetails: Event<void>
  private readonly executionDetailsChanged: EventEmitter<void>

  private dvcRoots: string[] = []

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private dvcPathOption = 'dvc.dvcPath'
  private defaultProjectOption = 'dvc.defaultProject'

  private dvcPathQuickPickItems = [
    {
      description: 'Use Python Extension virtual environment if available',
      label: 'Default',
      picked: true,
      value: undefined
    },
    {
      description: 'Browse the filesystem for a DVC executable',
      label: 'Find',
      value: async () => {
        const result = await window.showOpenDialog({
          title: 'Select a DVC executable'
        })
        if (result) {
          const [input] = result
          const { fsPath } = input
          this.setDvcPath(fsPath)
          return fsPath
        } else {
          return undefined
        }
      }
    }
  ]

  constructor() {
    makeObservable(this)

    this.executionDetailsChanged = this.dispose.track(new EventEmitter())
    this.onDidChangeExecutionDetails = this.executionDetailsChanged.event

    getPythonBinPath().then(path => {
      this.pythonBinPath = path
      return this.deferred.resolve()
    })

    getOnDidChangePythonExecutionDetails().then(
      onDidChangePythonExecutionDetails =>
        this.dispose.track(
          onDidChangePythonExecutionDetails?.(async () => {
            const oldPath = this.pythonBinPath
            this.pythonBinPath = await getPythonBinPath()
            this.notifyIfChanged(oldPath, this.pythonBinPath)
          })
        )
    )

    this.vsCodeTheme = window.activeColorTheme

    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this.vsCodeTheme = window.activeColorTheme
      })
    )
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

  public getFirstWorkspaceFolderRoot = (): string | undefined => {
    const { workspaceFolders } = workspace
    return workspaceFolders && workspaceFolders.length > 0
      ? workspaceFolders[0].uri.fsPath
      : undefined
  }

  public getCliPath(): string {
    return getConfigValue(this.dvcPathOption)
  }

  public selectDvcPath = async (): Promise<void> => {
    const result = await window.showQuickPick(this.dvcPathQuickPickItems, {
      placeHolder: 'Please choose...'
    })
    if (result) {
      const { value } = result
      if (typeof value === 'function') {
        await value()
      } else {
        this.setDvcPath(value)
      }
    }
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

  private notifyIfChanged(
    oldPath: string | undefined,
    newPath: string | undefined
  ) {
    if (oldPath !== newPath) {
      this.executionDetailsChanged.fire()
    }
  }

  private setDvcPath(path?: string): Thenable<void> {
    this.notifyIfChanged(this.getCliPath(), path)
    return setConfigValue(this.dvcPathOption, path)
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
