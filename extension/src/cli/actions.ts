import { Prompt } from './output'
import { getWarningResponse, showGenericError } from '../vscode/modal'

const offerToForce = async (
  stderr: string,
  forceFunc: (...args: string[]) => Promise<string>,
  ...args: string[]
): Promise<string | undefined> => {
  const text = stderr.replace(
    Prompt.TRY_FORCE,
    '\n\nWould you like to force this action?'
  )
  const response = await getWarningResponse(text, 'Force')
  if (response !== 'Force') {
    return
  }
  return forceFunc(...args)
}

export const chainCommands = async (
  func: (...args: string[]) => Promise<string>,
  forceFunc: (...args: string[]) => Promise<string>,
  ...args: string[]
): Promise<string | undefined> => {
  try {
    return await func(...args)
  } catch (e) {
    const stderr = e.stderr

    if (stderr?.includes(Prompt.TRY_FORCE)) {
      return offerToForce(stderr, forceFunc, ...args)
    }

    return showGenericError()
  }
}
