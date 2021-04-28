import { window } from 'vscode'

export const reportStderrOrThrow = (error: string) => {
  if (error) {
    return window.showErrorMessage(error)
  }
  throw new Error(error)
}
