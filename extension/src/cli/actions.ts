import { Args, Flag } from './args'
import { Prompt } from './output'
import { MaybeConsoleError } from './error'
import { getWarningResponse } from '../vscode/modal'
import { CommandId, InternalCommands } from '../commands/internal'

const offerToForce = async (
  stderr: string,
  internalCommands: InternalCommands,
  commandId: CommandId,
  ...args: Args
): Promise<string | undefined> => {
  const text = stderr.replace(
    Prompt.TRY_FORCE,
    '\n\nWould you like to force this action?'
  )
  const response = await getWarningResponse(text, 'Force')
  if (response !== 'Force') {
    return
  }
  return internalCommands.executeCommand(commandId, ...args, Flag.FORCE)
}

export const tryThenMaybeForce = async (
  internalCommands: InternalCommands,
  commandId: CommandId,
  ...args: Args
): Promise<string | undefined> => {
  try {
    return await internalCommands.executeCommand(commandId, ...args)
  } catch (e: unknown) {
    const stderr = (e as MaybeConsoleError).stderr

    if (stderr && Prompt.TRY_FORCE.test(stderr)) {
      return offerToForce(stderr, internalCommands, commandId, ...args)
    }

    throw e
  }
}
