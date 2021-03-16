import {
  ColorTheme,
  ColorThemeKind,
  StatusBarItem,
  window,
  workspace,
  WorkspaceConfiguration
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { makeObservable, observable } from 'mobx'
import { WebviewColorTheme } from './webviews/experiments/contract'

export class Config {
  public readonly dispose = Disposable.fn()

  @observable
  private _vsCodeTheme: ColorTheme

  private config: WorkspaceConfiguration

  public get dvcPath(): string {
    return <string>this.config.get('dvc.dvcPath')
  }

  public updateDvcPathStatusBarItem = (): void => {
    this.dvcPathStatusBarItem.text = this.dvcPath
  }

  public get theme(): WebviewColorTheme {
    if (this._vsCodeTheme.kind === ColorThemeKind.Dark) {
      return WebviewColorTheme.dark
    }
    return WebviewColorTheme.light
  }

  private dvcPathStatusBarItem: StatusBarItem

  constructor() {
    makeObservable(this)
    this._vsCodeTheme = window.activeColorTheme
    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this._vsCodeTheme = window.activeColorTheme
      })
    )
    this.config = workspace.getConfiguration()

    this.dvcPathStatusBarItem = window.createStatusBarItem()
    const dvcPath = process.env.DVCPATH
    if (dvcPath) {
      this.updateDvcPathStatusBarItem()
    }
    this.dvcPathStatusBarItem.tooltip = 'Current DVC path.'
    this.dvcPathStatusBarItem.command = 'dvc.selectDvcPath'
    this.dvcPathStatusBarItem.show()
  }
}
