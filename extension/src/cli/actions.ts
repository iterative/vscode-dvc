import { Args, Flag } from './args'
import { Prompt } from './output'
import { getWarningResponse, showGenericError } from '../vscode/modal'

const offerToForce = async (
  stderr: string,
  func: (...args: Args) => Promise<string>,
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
  return func(...args, Flag.FORCE)
}

export const tryThenMaybeForce = async (
  func: (...args: Args) => Promise<string>,
  ...args: Args
): Promise<string | undefined> => {
  try {
    return await func(...args)
  } catch (e) {
    const stderr = e.stderr

    if (stderr?.includes(Prompt.TRY_FORCE)) {
      return offerToForce(stderr, func, ...args)
    }

    return showGenericError()
  }
}
