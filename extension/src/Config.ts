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
import { makeObservable, observable } from 'mobx'
import { WebviewColorTheme } from './webviews/experiments/contract'
import { findDvcRootPaths } from './fileSystem'
import { Deferred } from '@hediet/std/synchronization'

export class Config {
  private readonly _initialized = new Deferred()

  private readonly initialized = this._initialized.promise

  public readonly dispose = Disposable.fn()
  public readonly workspaceRoot: string
  public dvcRootPaths: string[] = []

  private onDidChangeEmitter: EventEmitter<ConfigurationChangeEvent>
  readonly onDidChange: Event<ConfigurationChangeEvent>

  @observable
  private _vsCodeTheme: ColorTheme

  public get theme(): WebviewColorTheme {
    if (this._vsCodeTheme.kind === ColorThemeKind.Dark) {
      return WebviewColorTheme.dark
    }
    return WebviewColorTheme.light
  }

  public get ready() {
    return this.initialized
  }

  @observable
  private dvcPathStatusBarItem: StatusBarItem

  private updateDvcPathStatusBarItem = (path = this.dvcPath || ''): void => {
    this.dvcPathStatusBarItem.text = path
  }

  private getWorkspaceRoot = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  public get dvcPath(): string | undefined {
    return workspace.getConfiguration().get('dvc.dvcPath')
  }

  private setDvcPath(path?: string): Thenable<void> {
    return workspace.getConfiguration().update('dvc.dvcPath', path)
  }

  private createDvcPathStatusBarItem = () => {
    const dvcPathStatusBarItem = window.createStatusBarItem()

    dvcPathStatusBarItem.tooltip = 'Current DVC path.'
    dvcPathStatusBarItem.command = 'dvc.selectDvcPath'
    dvcPathStatusBarItem.text = this.dvcPath || ''
    dvcPathStatusBarItem.show()
    return dvcPathStatusBarItem
  }

  public selectDvcPath = async (): Promise<string | undefined> => {
    const result = await window.showQuickPick(
      [
        {
          label: 'Default',
          description: 'Use Python Extension virtual environment if available',
          picked: true,
          value: undefined
        },
        {
          label: 'Global',
          description: 'Always use the globally installed DVC binary',
          picked: true,
          value: 'dvc'
        },
        {
          label: 'Custom',
          description: 'Type in a DVC binary to use',
          value: () =>
            window.showInputBox({
              prompt: 'Enter a custom DVC path...'
            })
        }
      ],
      {
        placeHolder: 'Please choose...'
      }
    )
    if (result) {
      const resultValue =
        typeof result.value === 'function' ? await result.value() : result.value
      await this.setDvcPath(resultValue)
      return resultValue
    }
  }

  private findDvcRoots = async () => {
    const rootPaths = await findDvcRootPaths(this.workspaceRoot)
    this.dvcRootPaths = rootPaths
  }

  constructor() {
    makeObservable(this)

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
        if (e.affectsConfiguration('dvc.dvcPath')) {
          this.onDidChangeEmitter.fire(e)
        }
      })
    )

    this.dispose.track(
      this.onDidChange(() => {
        this.updateDvcPathStatusBarItem()
        this.findDvcRoots()
      })
    )
  }
}
