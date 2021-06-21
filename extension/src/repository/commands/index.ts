import { relative } from 'path'
import { Uri } from 'vscode'
import { tryThenMaybeForce_ } from '../../cli/actions'
import { InternalCommands } from '../../internalCommands'
import { showGenericError } from '../../vscode/modal'

export type ResourceCommand = ({
  dvcRoot,
  resourceUri
}: {
  dvcRoot: string
  resourceUri: Uri
}) => Promise<string | undefined>

export const getResourceCommand = (
  internalCommands: InternalCommands,
  name: string
): ResourceCommand => ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)

  return tryThenMaybeForce_(internalCommands, name, dvcRoot, relPath)
}

export const getSimpleResourceCommand = (
  internalCommands: InternalCommands,
  name: string
): ResourceCommand => async ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)
  try {
    return await internalCommands.executeCommand(name, dvcRoot, relPath)
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
  internalCommands: InternalCommands,
  name: string
): RootCommand => ({ rootUri }) => {
  const cwd = rootUri.fsPath

  return tryThenMaybeForce_(internalCommands, name, cwd)
}
