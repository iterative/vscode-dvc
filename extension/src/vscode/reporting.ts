import { window } from 'vscode'

export const reportStderrOrThrow = (
  error: Error & { stdout?: string; stderr?: string }
) => {
  if (error.stderr) {
    return window.showErrorMessage(error.stderr)
  }
  throw error
}
