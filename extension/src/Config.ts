import { window, ColorThemeKind, ColorTheme } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { observable } from 'mobx'

export class Config {
  public readonly dispose = Disposable.fn()

  @observable
  private _vsCodeTheme: ColorTheme

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
    this._vsCodeTheme = window.activeColorTheme
    this.dispose.track(
      window.onDidChangeActiveColorTheme(() => {
        this._vsCodeTheme = window.activeColorTheme
      })
    )
  }
}
