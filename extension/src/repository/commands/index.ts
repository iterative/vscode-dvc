import { relative } from 'path'
import { Uri } from 'vscode'
import { tryThenMaybeForce } from '../../cli/actions'
import { AvailableCommands, InternalCommands } from '../../internalCommands'
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
  name: AvailableCommands
): ResourceCommand => ({ dvcRoot, resourceUri }) => {
  const relPath = relative(dvcRoot, resourceUri.fsPath)

  return tryThenMaybeForce(internalCommands, name, dvcRoot, relPath)
}

export const getSimpleResourceCommand = (
  internalCommands: InternalCommands,
  name: AvailableCommands
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
  name: AvailableCommands
): RootCommand => ({ rootUri }) => {
  const cwd = rootUri.fsPath

  return tryThenMaybeForce(internalCommands, name, cwd)
}
