import { Disposable } from '@hediet/std/disposable'
import { StatusBarItem, window, workspace } from 'vscode'
import { getConfig } from './configuration'

/**
 * Status bar item. Displays the current DVC path. Corresponds to "dvc.dvcPath" setting.
 * Choose from all detected & defined alternatives on-click.
 */
export class DVCPathStatusBarItem {
  public readonly dispose = Disposable.fn()

  private instance: StatusBarItem

  constructor() {
    this.instance = window.createStatusBarItem()
    this.instance.tooltip = 'Current DVC executable.'
    this.instance.command = 'dvc.selectDvcPath'
    this.update()
    this.instance.show()
  }

  /**
   * Updates the text content of the status bar item to reflect the selection.
   */
  public update(): void {
    const config = getConfig()
    this.instance.text = config.dvcPath
  }
}

/**
 * Shows an input dialog allowing the user to enter a custom executable path.
 */
async function defineExecutable(): Promise<string | undefined> {
  return window.showInputBox({
    prompt: 'Enter a custom DVC executable path...'
  })
}

/**
 * Shows a dialog allowing the user to choose from a list of detected DVC executables or define their own.
 */
export async function selectExecutable(): Promise<void> {
  // TODO: detection call and append to quick pick
  let path: string | undefined
  const result = await window.showQuickPick(
    [{ label: 'default' }, { label: 'custom' }],
    { placeHolder: 'Please choose...' }
  )
  if (result) {
    if (result.label === 'default') {
      path = 'dvc'
    }
    if (result.label === 'custom') {
      path = await defineExecutable()
    }
    workspace.getConfiguration().update('dvc.dvcPath', path)
  }
}
