import {
  ColorTheme,
  ColorThemeKind,
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

  public get theme(): WebviewColorTheme {
    if (this._vsCodeTheme.kind === ColorThemeKind.Dark) {
      return WebviewColorTheme.dark
    }
    return WebviewColorTheme.light
  }

  constructor() {
    makeObservable(this)
    this._vsCodeTheme = window.activeColorTheme
    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this._vsCodeTheme = window.activeColorTheme
      })
    )
    this.config = workspace.getConfiguration()
  }
}
