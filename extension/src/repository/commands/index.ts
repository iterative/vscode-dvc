import { relative } from 'path'
import { Uri } from 'vscode'
import { Prompt } from '../../cli/output'
import { getWarningResponse, showGenericError } from '../../vscode/modal'

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

const getCommand = async (
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

export type ResourceCommand = ({
  dvcRoot,
  resourceUri
}: {
  dvcRoot: string
  resourceUri: Uri
}) => Promise<string | undefined>

export const getResourceCommand = (
  func: (cwd: string, target: string) => Promise<string>,
  forceFunc: (cwd: string, target: string) => Promise<string>
): ResourceCommand => ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)

  return getCommand(func, forceFunc, dvcRoot, relPath)
}

export const getSimpleResourceCommand = (
  func: (cwd: string, target: string) => Promise<string>
): ResourceCommand => async ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)
  try {
    return await func(dvcRoot, relPath)
  } catch {
    return showGenericError()
  }
}

export type RootCommand = ({
  rootUri
}: {
  rootUri: Uri
}) => Promise<string | undefined>

export const getRootCommand = (
  func: (fsPath: string) => Promise<string>,
  forceFunc: (fsPath: string) => Promise<string>
): RootCommand => ({ rootUri }) => {
  const cwd = rootUri.fsPath

  return getCommand(func, forceFunc, cwd)
}
