import { window } from 'vscode'
import { MaybeConsoleError } from '../cli/error'
export const reportErrorMessage = (error: MaybeConsoleError) =>
  window.showErrorMessage(error.stderr || error.message)
