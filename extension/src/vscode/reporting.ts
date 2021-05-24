import { window } from 'vscode'

export const reportStderrOrThrow = (
  error: Error & { stdout?: string; stderr?: string }
) => {
  if (error.stderr) {
    if (error.stderr.includes('dvc exp run')) {
      return
    }

    const message = `${error.message}. Reason: ${error.stderr}`
    return window.showErrorMessage(message)
  }
  throw error
}
