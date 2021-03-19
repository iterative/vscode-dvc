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
import glob from 'tiny-glob'
import { join } from 'path'
import { accessSync } from 'fs-extra'

export class Config {
  public readonly dispose = Disposable.fn()
  public readonly workspaceRoot: string
  public dvcBinPath: string | undefined

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
    }
  }

  private getWorkspaceRoot = (): string => {
    const { workspaceFolders } = workspace
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('There are no folders in the Workspace to operate on!')
    }

    return workspaceFolders[0].uri.fsPath
  }

  private getBinaryPath = async (): Promise<string | undefined> => {
    try {
      accessSync('dvc')
      return 'dvc'
    } catch {}

    try {
      accessSync(this.dvcPath)
      return this.dvcPath
    } catch {}

    const files = await glob(join('**', this.dvcPath), {
      absolute: true,
      flush: true,
      filesOnly: true,
      cwd: this.workspaceRoot
    })

    return files.find(file => {
      try {
        accessSync(file)
        return file
      } catch {}
    })
  }

  private setDvcBinPath = async (): Promise<void> => {
    this.dvcBinPath = await this.getBinaryPath()
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

  constructor() {
    makeObservable(this)

    this.workspaceRoot = this.getWorkspaceRoot()

    this.setDvcBinPath()

    this._vsCodeTheme = window.activeColorTheme

    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this._vsCodeTheme = window.activeColorTheme
      })
    )

    this.dvcPathStatusBarItem = this.createDvcPathStatusBarItem()
    this.overrideStatusBar()

    this.dispose.track(
      workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('dvc.dvcPath')) {
          this.updateDvcPathStatusBarItem()
          this.setDvcBinPath()
        }
      })
    )
  }
}
