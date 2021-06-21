import { relative } from 'path'
import { Uri } from 'vscode'
import { tryThenMaybeForce, tryThenMaybeForce_ } from '../../cli/actions'
import { Args } from '../../cli/args'
import { InternalCommands } from '../../internalCommands'
import { showGenericError } from '../../vscode/modal'

export type ResourceCommand = ({
  dvcRoot,
  resourceUri
}: {
  dvcRoot: string
  resourceUri: Uri
}) => Promise<string | undefined>

export const getResourceCommand =
  (
    func: (cwd: string, target: string, ...args: Args) => Promise<string>
  ): ResourceCommand =>
  ({ dvcRoot, resourceUri }) => {
    const relPath = relative(dvcRoot, resourceUri.fsPath)

    return tryThenMaybeForce(func, dvcRoot, relPath)
  }

export const getResourceCommand_ =
  (internalCommands: InternalCommands, name: string): ResourceCommand =>
  ({ dvcRoot, resourceUri }) => {
    const relPath = relative(dvcRoot, resourceUri.fsPath)

    return tryThenMaybeForce_(internalCommands, name, dvcRoot, relPath)
  }

export const getSimpleResourceCommand =
  (internalCommands: InternalCommands, name: string): ResourceCommand =>
  async ({ dvcRoot, resourceUri }) => {
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

export const getRootCommand =
  (func: (fsPath: string, ...args: Args) => Promise<string>): RootCommand =>
  ({ rootUri }) => {
    const cwd = rootUri.fsPath

    return tryThenMaybeForce(func, cwd)
  }

export const getRootCommand_ =
  (internalCommands: InternalCommands, name: string): RootCommand =>
  ({ rootUri }) => {
    const cwd = rootUri.fsPath

    return tryThenMaybeForce_(internalCommands, name, cwd)
  }
