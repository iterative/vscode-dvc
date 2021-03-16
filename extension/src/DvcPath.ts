import { Disposable } from '@hediet/std/disposable'
import { StatusBarItem, window, workspace } from 'vscode'

export const getDvcPath = (): string =>
  workspace.getConfiguration().get('dvc.dvcPath') || 'dvc'

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
    this.instance.text = getDvcPath()
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
  const result = await window.showQuickPick(
    [{ label: 'default' }, { label: 'custom' }],
    { placeHolder: 'Please choose...' }
  )
  if (result) {
    if (result.label === 'default') {
      await workspace.getConfiguration().update('dvc.dvcPath', 'dvc')
      return getDvcPath()
    }
    if (result.label === 'custom') {
      const path = await defineDvcPath()
      await workspace.getConfiguration().update('dvc.dvcPath', path)
      return getDvcPath()
    }
  }
}
