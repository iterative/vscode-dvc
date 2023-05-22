import { commands } from 'vscode'
import { RegisteredCommands } from './external'
import { Setup } from '../setup'
import { Context } from '../vscode/context'

export const showSetupOrExecuteCommand =
  <T>(setup: Setup, callback: (context: Context) => Promise<T | undefined>) =>
  (context: Context) => {
    if (!setup.isDvcSetup()) {
      return commands.executeCommand(RegisteredCommands.SETUP_SHOW_DVC)
    }

    if (!setup.isExperimentsSetup()) {
      return commands.executeCommand(RegisteredCommands.SETUP_SHOW_EXPERIMENTS)
    }

    return callback(context)
  }
