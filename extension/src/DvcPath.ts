import { Disposable } from '@hediet/std/disposable'
import { StatusBarItem, window, workspace } from 'vscode'
import { getConfig } from './Config'

export const getDvcPath = (): string =>
  workspace.getConfiguration().get('dvc.dvcPath') || 'dvc'

/**
 * Status bar item. Displays the current DVC path. Corresponds to "dvc.dvcPath" setting.
 * Choose from all detected & defined alternatives on-click.
 */
export class DVCPathStatusBarItem {
  public readonly dispose = Disposable.fn()

  private instance: StatusBarItem

  constructor() {
    const dvcPath = process.env.DVCPATH
    if (dvcPath) {
      workspace.getConfiguration().update('dvc.dvcPath', dvcPath)
    }
    this.instance = window.createStatusBarItem()
    this.instance.tooltip = 'Current DVC path.'
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
 * Shows an input dialog allowing the user to enter a custom path.
 */
async function defineDvcPath(): Promise<string | undefined> {
  return window.showInputBox({
    prompt: 'Enter a custom DVC path...'
  })
}

/**
 * Shows a dialog allowing the user to choose from a list of detected DVC paths or define their own.
 */
export async function selectDvcPath(): Promise<string | undefined> {
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
      path = await defineDvcPath()
    }

    await workspace.getConfiguration().update('dvc.dvcPath', path)
    return getDvcPath()
  }
}
