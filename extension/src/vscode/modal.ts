import { window } from 'vscode'

export const getWarningResponse = (
  text: string,
  ...items: string[]
): Thenable<string | undefined> =>
  window.showWarningMessage(text, { modal: true }, ...items)

export const showGenericError = (): Thenable<string | undefined> =>
  window.showErrorMessage(
    'Something went wrong, please see the DVC output channel for more details.',
    { modal: true }
  )
