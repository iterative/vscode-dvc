import { relative } from 'path'
import { Uri } from 'vscode'
import { tryThenMaybeForce_ } from '../../cli/actions'
import { Args } from '../../cli/args'
import { showGenericError } from '../../vscode/modal'

export type ResourceCommand = ({
  dvcRoot,
  resourceUri
}: {
  dvcRoot: string
  resourceUri: Uri
}) => Promise<string | undefined>

export const getResourceCommand = (
  func: (cwd: string, target: string, ...args: Args) => Promise<string>
): ResourceCommand => ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)

  return tryThenMaybeForce_(func, dvcRoot, relPath)
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
  func: (fsPath: string, ...args: Args) => Promise<string>
): RootCommand => ({ rootUri }) => {
  const cwd = rootUri.fsPath

  return tryThenMaybeForce_(func, cwd)
}
