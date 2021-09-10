import { window } from 'vscode'

export const getWarningResponse = (
  text: string,
  ...items: string[]
): Thenable<string | undefined> =>
  window.showWarningMessage(text, { modal: true }, ...items)
