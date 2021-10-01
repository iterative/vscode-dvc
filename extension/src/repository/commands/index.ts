import { relative } from 'path'
import { Uri } from 'vscode'
import { tryThenMaybeForce } from '../../cli/actions'
import { Flag } from '../../cli/args'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../commands/internal'
import { gitResetWorkspace } from '../../git'
import { getWarningResponse } from '../../vscode/modal'

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
  ({ dvcRoot, resourceUri }) => {
    const relPath = relative(dvcRoot, resourceUri.fsPath)

    return internalCommands.executeCommand(commandId, dvcRoot, relPath)
  }

export type Root = { rootUri: Uri }

type RootCommand = ({ rootUri }: Root) => Promise<string | undefined>

export const getRootCommand =
  (internalCommands: InternalCommands, commandId: CommandId): RootCommand =>
  ({ rootUri }) => {
    const cwd = rootUri.fsPath

    return tryThenMaybeForce(internalCommands, commandId, cwd)
  }

export const getResetRootCommand =
  (internalCommands: InternalCommands): RootCommand =>
  async ({ rootUri }) => {
    const cwd = rootUri.fsPath

    const response = await getWarningResponse(
      'Are you sure you want to discard ALL workspace changes?\n' +
        'This is IRREVERSIBLE!\n' +
        'Your current working set will be FOREVER LOST if you proceed.',
      'Discard Changes'
    )

    if (response !== 'Discard Changes') {
      return
    }

    await gitResetWorkspace(cwd)

    return internalCommands.executeCommand(
      AvailableCommands.CHECKOUT,
      cwd,
      Flag.FORCE
    )
  }
