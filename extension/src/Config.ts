import {
  ColorTheme,
  ColorThemeKind,
  ConfigurationChangeEvent,
  EventEmitter,
  Event,
  StatusBarItem,
  window,
  workspace
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { WebviewColorTheme } from './webviews/experiments/contract'
import {
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath
} from './extensions/python'

export class Config {
  public readonly dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  public get ready() {
    return this.initialized
  }

  public readonly workspaceRoot: string

  private onDidChangeEmitter: EventEmitter<ConfigurationChangeEvent>
  readonly onDidChange: Event<ConfigurationChangeEvent>

  @observable
  public pythonBinPath: string | undefined

  @observable
  private _vsCodeTheme: ColorTheme

  public get theme(): WebviewColorTheme {
    if (this._vsCodeTheme.kind === ColorThemeKind.Dark) {
      return WebviewColorTheme.dark
    }
    return WebviewColorTheme.light
  }

  @observable
  private dvcPathStatusBarItem: StatusBarItem

  private updateDvcPathStatusBarItem = (path = this.dvcPath): void => {
    this.dvcPathStatusBarItem.text = path
  }

  private getWorkspaceRoot = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private dvcPathOption = 'dvc.dvcPath'

  public get dvcPath(): string {
    return workspace.getConfiguration().get(this.dvcPathOption, '')
  }

  private setDvcPath(path?: string): Thenable<void> {
    return workspace.getConfiguration().update(this.dvcPathOption, path)
  }

  private createDvcPathStatusBarItem = () => {
    const dvcPathStatusBarItem = window.createStatusBarItem()

    dvcPathStatusBarItem.tooltip = 'Current DVC path.'
    dvcPathStatusBarItem.command = 'dvc.selectDvcPath'
    dvcPathStatusBarItem.text = this.dvcPath
    dvcPathStatusBarItem.show()
    return dvcPathStatusBarItem
  }

  private getDvcPathQuickPickOptions() {
    return [
      {
        label: 'Default',
        description: 'Use Python Extension virtual environment if available',
        picked: true,
        value: undefined
      },
      {
        label: 'Find',
        description: 'Browse the filesystem for a DVC executable',
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
  }

  public selectDvcPath = async (): Promise<void> => {
    const quickPickOptions = this.getDvcPathQuickPickOptions()
    const result = await window.showQuickPick(quickPickOptions, {
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

  constructor() {
    makeObservable(this)

    getPythonBinPath().then(path => {
      this.pythonBinPath = path
      return this._initialized.resolve()
    })

    getOnDidChangePythonExecutionDetails().then(
      onDidChangePythonExecutionDetails =>
        this.dispose.track(
          onDidChangePythonExecutionDetails?.(async () => {
            this.pythonBinPath = await getPythonBinPath()
          })
        )
    )

    this.workspaceRoot = this.getWorkspaceRoot()

    this._vsCodeTheme = window.activeColorTheme

    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this._vsCodeTheme = window.activeColorTheme
      })
    )

    this.dvcPathStatusBarItem = this.createDvcPathStatusBarItem()

    this.onDidChangeEmitter = this.dispose.track(new EventEmitter())
    this.onDidChange = this.onDidChangeEmitter.event

    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(this.dvcPathOption)) {
          this.onDidChangeEmitter.fire(e)
        }
      })
    )

    this.dispose.track(
      this.onDidChange(() => {
        this.updateDvcPathStatusBarItem()
      })
    )
  }
}
