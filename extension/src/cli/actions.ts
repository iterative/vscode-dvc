import { Args, Flag } from './args'
import { Prompt } from './output'
import { getWarningResponse, showGenericError } from '../vscode/modal'
import { InternalCommands } from '../internalCommands'

const offerToForce = async (
  stderr: string,
  internalCommands: InternalCommands,
  name: string,
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
  return internalCommands.executeCommand(name, ...args, Flag.FORCE)
}

export const tryThenMaybeForce = async (
  internalCommands: InternalCommands,
  name: string,
  ...args: Args
): Promise<string | undefined> => {
  try {
    return await internalCommands.executeCommand(name, ...args)
  } catch (e) {
    const stderr = e.stderr

    if (stderr?.includes(Prompt.TRY_FORCE)) {
      return offerToForce(stderr, internalCommands, name, ...args)
    }

    return showGenericError()
  }
}
