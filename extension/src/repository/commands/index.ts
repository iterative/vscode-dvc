import { relative } from 'path'
import { Uri } from 'vscode'
import { tryThenMaybeForce } from '../../cli/actions'
import { CommandId, InternalCommands } from '../../commands/internal'
import { showGenericError } from '../../vscode/modal'

export type Resource = {
  dvcRoot: string
  resourceUri: Uri
}

type ResourceCommand = ({
  dvcRoot,
  resourceUri
}: Resource) => Promise<string | undefined>

export const getResourceCommand =
  (internalCommands: InternalCommands, commandId: CommandId): ResourceCommand =>
  ({ dvcRoot, resourceUri }) => {
    const relPath = relative(dvcRoot, resourceUri.fsPath)

    return tryThenMaybeForce(internalCommands, commandId, dvcRoot, relPath)
  }

export const getSimpleResourceCommand =
  (internalCommands: InternalCommands, commandId: CommandId): ResourceCommand =>
  async ({ dvcRoot, resourceUri }) => {
    const relPath = relative(dvcRoot, resourceUri.fsPath)
    try {
      return await internalCommands.executeCommand(commandId, dvcRoot, relPath)
    } catch {
      return showGenericError()
    }
  }

export type Root = { rootUri: Uri }

type RootCommand = ({ rootUri }: Root) => Promise<string | undefined>

export const getRootCommand =
  (internalCommands: InternalCommands, commandId: CommandId): RootCommand =>
  ({ rootUri }) => {
    const cwd = rootUri.fsPath

    return tryThenMaybeForce(internalCommands, commandId, cwd)
  }
