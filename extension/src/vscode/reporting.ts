import { window } from 'vscode'

export const reportStderrOrThrow = (
  error: Error & { stdout?: string; stderr?: string }
) => {
  if (error.stderr) {
    if (error.stderr.includes('dvc exp run')) {
      return
    }

    return window.showErrorMessage(error.stderr)
  }
  throw error
}
