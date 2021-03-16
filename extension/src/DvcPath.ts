import { window, workspace } from 'vscode'

export const getDvcPath = (): string =>
  workspace.getConfiguration().get('dvc.dvcPath') || 'dvc'

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
