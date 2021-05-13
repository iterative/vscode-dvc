import {
  ColorTheme,
  ColorThemeKind,
  EventEmitter,
  Event,
  StatusBarItem,
  window,
  workspace
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { WebviewColorTheme } from './Experiments/Webview/contract'
import {
  getOnDidChangePythonExecutionDetails,
  getPythonBinPath
} from './extensions/python'
import { ExecutionOptions } from './cli/execution'

export class Config {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  public readonly workspaceRoot: string

  private executionDetailsChanged: EventEmitter<void>
  public readonly onDidChangeExecutionDetails: Event<void>

  @observable
  public pythonBinPath: string | undefined

  @observable
  private vsCodeTheme: ColorTheme

  public getTheme(): WebviewColorTheme {
    if (this.vsCodeTheme.kind === ColorThemeKind.Dark) {
      return WebviewColorTheme.dark
    }
    return WebviewColorTheme.light
  }

  public getExecutionOptions(): ExecutionOptions {
    return {
      cliPath: this.getCliPath(),
      cwd: this.workspaceRoot,
      pythonBinPath: this.pythonBinPath
    }
  }

  @observable
  private dvcPathStatusBarItem: StatusBarItem

  private updateDvcPathStatusBarItem = (path = this.getCliPath()): void => {
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

  public getCliPath(): string {
    return workspace.getConfiguration().get(this.dvcPathOption, '')
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
    return workspace.getConfiguration().update(this.dvcPathOption, path)
  }

  private createDvcPathStatusBarItem = () => {
    const dvcPathStatusBarItem = window.createStatusBarItem()

    dvcPathStatusBarItem.tooltip = 'Current DVC path.'
    dvcPathStatusBarItem.command = 'dvc.selectDvcPath'
    dvcPathStatusBarItem.text = this.getCliPath()
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

    this.workspaceRoot = this.getWorkspaceRoot()

    this.vsCodeTheme = window.activeColorTheme

    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this.vsCodeTheme = window.activeColorTheme
      })
    )

    this.dvcPathStatusBarItem = this.createDvcPathStatusBarItem()

    this.executionDetailsChanged = this.dispose.track(new EventEmitter<void>())
    this.onDidChangeExecutionDetails = this.executionDetailsChanged.event

    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(this.dvcPathOption)) {
          this.updateDvcPathStatusBarItem()
        }
      })
    )
  }
}
