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

export class Config {
  public readonly dispose = Disposable.fn()

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
      this.updateDvcPathStatusBarItem(dvcPath)
    }
  }

  public get dvcPath(): string {
    return <string>workspace.getConfiguration().get('dvc.dvcPath')
  }

  private createDvcPathStatusBarItem = () => {
    const dvcPathStatusBarItem = window.createStatusBarItem()

    dvcPathStatusBarItem.tooltip = 'Current DVC path.'
    dvcPathStatusBarItem.command = 'dvc.selectDvcPath'
    dvcPathStatusBarItem.show()
    return dvcPathStatusBarItem
  }

  constructor() {
    makeObservable(this)
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
        }
      })
    )
  }
}
