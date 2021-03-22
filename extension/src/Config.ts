import {
  ColorTheme,
  ColorThemeKind,
  StatusBarItem,
  window,
  workspace
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { makeObservable, observable } from 'mobx'
import { WebviewColorTheme } from './webviews/experiments/contract'
import { findCliPath, findDvcRoots } from './fileSystem'
import { getRoot } from './cli/reader'

export class Config {
  public readonly dispose = Disposable.fn()
  public readonly workspaceRoot: string
  public dvcCliPath = 'dvc'
  public dvcRoots: string[] = []

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

  private overrideStatusBar = () => {
    const dvcPath = process.env.DVCPATH
    if (dvcPath) {
      this.setDvcPath(dvcPath)
      this.updateDvcPathStatusBarItem(dvcPath)
      this.setDvcCliPath()
    }
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

  findDvcRoots = async () => {
    const roots = await findDvcRoots(this.workspaceRoot)
    if (roots !== []) {
      this.dvcRoots = roots
      return
    }
    try {
      const root = await getRoot({
        cliPath: this.dvcCliPath,
        cwd: this.workspaceRoot
      })
      if (root) {
        this.dvcRoots = [root]
      }
    } catch (e) {
      throw new Error('Could not find a root DVC folder')
    }
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
    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('dvc.dvcPath')) {
          this.updateDvcPathStatusBarItem()
          this.setDvcCliPath()
          this.findDvcRoots()
        }
      })
    )
    this.overrideStatusBar()
    this.findDvcRoots()
  }
}
