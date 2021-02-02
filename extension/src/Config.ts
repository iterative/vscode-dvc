import {
  ColorTheme,
  ColorThemeKind,
  window,
  workspace,
  WorkspaceConfiguration
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { makeObservable, observable } from 'mobx'

export class Config {
  public readonly dispose = Disposable.fn()

  @observable
  private _vsCodeTheme: ColorTheme

  private config: WorkspaceConfiguration

  public get dvcPath(): string {
    return <string>this.config.get('dvc.dvcPath')
  }

  public get theme(): 'light' | 'dark' {
    if (this._vsCodeTheme.kind === ColorThemeKind.Light) {
      return 'light'
    }
    if (this._vsCodeTheme.kind === ColorThemeKind.Dark) {
      return 'dark'
    }
    return 'light'
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

export function getConfig(): Config {
  return new Config()
}
