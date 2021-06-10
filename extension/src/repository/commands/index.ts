import { Uri } from 'vscode'
import { Prompt } from '../../cli/output'
import { getWarningResponse, showGenericError } from '../../vscode/modal'

const offerToForce = async (
  stderr: string,
  forceFunc: (fsPath: string) => Promise<string>,
  cwd: string
): Promise<string | undefined> => {
  const text = stderr.replace(
    Prompt.TRY_FORCE,
    '\n\nWould you like to force this action?'
  )
  const response = await getWarningResponse(text, 'Force')
  if (response !== 'Force') {
    return
  }
  return forceFunc(cwd)
}

export const getRootCommand = (
  func: (fsPath: string) => Promise<string>,
  forceFunc: (fsPath: string) => Promise<string>
) => async ({ rootUri }: { rootUri: Uri }): Promise<string | undefined> => {
  const cwd = rootUri.fsPath

  try {
    return await func(cwd)
  } catch (e) {
    const stderr = e.stderr

    if (stderr?.includes(Prompt.TRY_FORCE)) {
      return offerToForce(stderr, forceFunc, cwd)
    }

    return showGenericError()
  }
}
