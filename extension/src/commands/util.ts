import { commands } from 'vscode'
import { RegisteredCommands } from './external'
import { Setup } from '../setup'
import { Context } from '../vscode/context'

export const showSetupOrExecuteCommand =
  <T>(setup: Setup, callback: (context: Context) => Promise<T | undefined>) =>
  async (context: Context) => {
    await setup.isReady()
    const { dvc, experiments } = setup.shouldBeShown()
    if (!dvc) {
      return commands.executeCommand(RegisteredCommands.SETUP_SHOW_DVC)
    }

    if (!experiments) {
      return commands.executeCommand(RegisteredCommands.SETUP_SHOW_EXPERIMENTS)
    }

    return callback(context)
  }
