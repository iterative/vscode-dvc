import { commands, Uri } from 'vscode'
import { tryThenMaybeForce } from '../../cli/actions'
import { Flag } from '../../cli/constants'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../commands/internal'
import { relativeWithUri } from '../../fileSystem'
import { gitReset, gitResetWorkspace, gitStageAll } from '../../git'
import { warnOfConsequences } from '../../vscode/modal'
import { Response } from '../../vscode/response'
import { WorkspaceRepositories } from '../workspace'

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
    const relPath = relativeWithUri(dvcRoot, resourceUri)

    return tryThenMaybeForce(internalCommands, commandId, dvcRoot, relPath)
  }

export const getSimpleResourceCommand =
  (internalCommands: InternalCommands, commandId: CommandId): ResourceCommand =>
  ({ dvcRoot, resourceUri }) => {
    const relPath = relativeWithUri(dvcRoot, resourceUri)

    return internalCommands.executeCommand(commandId, dvcRoot, relPath)
  }

export type Root = { rootUri: Uri }

type RootCommand = (context?: Root) => Promise<string | undefined>

const shouldTitleCommandReturnNoop = async (
  cwd: string | undefined,
  internalCommands: InternalCommands
): Promise<boolean> => {
  return (
    !cwd ||
    (await internalCommands.executeCommand<boolean>(
      AvailableCommands.IS_EXECUTOR_RUNNING
    ))
  )
}

export const getRootCommand =
  (
    repositories: WorkspaceRepositories,
    internalCommands: InternalCommands,
    commandId: CommandId
  ): RootCommand =>
  async context => {
    const cwd = await repositories.getCwd(context?.rootUri)

    if (await shouldTitleCommandReturnNoop(cwd, internalCommands)) {
      return
    }

    return tryThenMaybeForce(internalCommands, commandId, cwd as string)
  }

export const getStageAllCommand =
  (repositories: WorkspaceRepositories): RootCommand =>
  async context => {
    const cwd = await repositories.getCwd(context?.rootUri)

    if (!cwd) {
      return
    }

    await gitStageAll(cwd)
    return commands.executeCommand('workbench.scm.focus')
  }

export const getUnstageAllCommand =
  (repositories: WorkspaceRepositories): RootCommand =>
  async context => {
    const cwd = await repositories.getCwd(context?.rootUri)

    if (!cwd) {
      return
    }

    return gitReset(cwd)
  }

export const getCommitRootCommand =
  (
    repositories: WorkspaceRepositories,
    internalCommands: InternalCommands
  ): RootCommand =>
  async context => {
    const cwd = await repositories.getCwdWithChanges(context?.rootUri)

    if (await shouldTitleCommandReturnNoop(cwd, internalCommands)) {
      return
    }

    await tryThenMaybeForce(
      internalCommands,
      AvailableCommands.COMMIT,
      cwd as string
    )
    return commands.executeCommand('workbench.scm.focus')
  }

export const getResetRootCommand =
  (
    repositories: WorkspaceRepositories,
    internalCommands: InternalCommands
  ): RootCommand =>
  async context => {
    const cwd = await repositories.getCwdWithChanges(context?.rootUri)

    if (await shouldTitleCommandReturnNoop(cwd, internalCommands)) {
      return
    }

    const response = await warnOfConsequences(
      'Are you sure you want to discard ALL workspace changes?\n' +
        'This is IRREVERSIBLE!\n' +
        'Your current working set will be FOREVER LOST if you proceed.',
      Response.DISCARD
    )

    if (response !== Response.DISCARD) {
      return
    }

    await gitResetWorkspace(cwd as string)

    return internalCommands.executeCommand(
      AvailableCommands.CHECKOUT,
      cwd as string,
      Flag.FORCE
    )
  }
