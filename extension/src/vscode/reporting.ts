import { window } from 'vscode'
import { MaybeConsoleError } from '../cli/error'
import { RegisteredCommands } from '../commands/external'

const reportErrorMessage = (error: MaybeConsoleError) =>
  window.showErrorMessage(error.stderr || error.message)

export const report = async (stdout: Promise<string>) => {
  try {
    window.showInformationMessage((await stdout) || 'Operation successful.')
  } catch (e) {
    reportErrorMessage(e)
  }
}

export const reportCommandFailed = (
  command: RegisteredCommands
): Thenable<string | undefined> =>
  window.showErrorMessage(
    `${command} failed. See the Log (Extension Host) output channel for more details.`
  )
