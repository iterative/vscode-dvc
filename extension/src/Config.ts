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
import { findCliPath, findDvcRootPaths } from './fileSystem'
import { Deferred } from '@hediet/std/synchronization'

export class Config {
  private readonly _initialized = new Deferred()

  private readonly initialized = this._initialized.promise

  public readonly dispose = Disposable.fn()
  public readonly workspaceRoot: string
  public dvcCliPath = 'dvc'
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

  private updateDvcPathStatusBarItem = (path = this.dvcPath): void => {
    this.dvcPathStatusBarItem.text = path
  }

  private setDvcPaths = async () => {
    this.updateDvcPathStatusBarItem()
    await this.setDvcCliPath()
    return this.findDvcRoots()
  }

  private setDvcPathsOnActivation = async (dvcPath?: string) => {
    await this.setDvcPath(dvcPath)
    return this.setDvcPaths()
  }

  private getWorkspaceRoot = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private setDvcCliPath = async (): Promise<void> => {
    const path = await findCliPath(this.workspaceRoot, this.dvcPath)
    if (path) {
      this.dvcCliPath = path
    }
  }

  public get dvcPath(): string {
    return <string>workspace.getConfiguration().get('dvc.dvcPath')
  }

  private setDvcPath(path = 'dvc'): Thenable<void> {
    return workspace.getConfiguration().update('dvc.dvcPath', path)
  }

  private createDvcPathStatusBarItem = () => {
    const dvcPathStatusBarItem = window.createStatusBarItem()

    dvcPathStatusBarItem.tooltip = 'Current DVC path.'
    dvcPathStatusBarItem.command = 'dvc.selectDvcPath'
    dvcPathStatusBarItem.show()
    return dvcPathStatusBarItem
  }

  public selectDvcPath = async (): Promise<string | undefined> => {
    const result = await window.showQuickPick(
      [{ label: 'default' }, { label: 'custom' }],
      { placeHolder: 'Please choose...' }
    )
    if (result) {
      if (result.label === 'default') {
        await this.setDvcPath()
        return this.dvcPath
      }
      if (result.label === 'custom') {
        const path = await window.showInputBox({
          prompt: 'Enter a custom DVC path...'
        })
        await this.setDvcPath(path)
        return this.dvcPath
      }
    }
  }

  private findDvcRoots = async () => {
    const rootPaths = await findDvcRootPaths(
      this.workspaceRoot,
      this.dvcCliPath
    )
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
      this.onDidChange(async () => {
        this.setDvcPaths()
      })
    )

    const dvcOverridePath = process.env.DVCPATH
    this.setDvcPathsOnActivation(dvcOverridePath).then(() =>
      this._initialized.resolve()
    )
  }
}
