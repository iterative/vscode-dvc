import { relative } from 'path'
import { commands, Uri } from 'vscode'
import { tryThenMaybeForce } from '../../cli/actions'
import { Flag } from '../../cli/args'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../../commands/internal'
import { gitResetWorkspace, gitStageAll, gitUnstageAll } from '../../git'
import { getWarningResponse } from '../../vscode/modal'
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

type RootCommand = (context?: Root) => Promise<string | undefined>

export const getRootCommand =
  (
    repositories: WorkspaceRepositories,
    internalCommands: InternalCommands,
    commandId: CommandId
  ): RootCommand =>
  async context => {
    const cwd = await repositories.getCwd(context?.rootUri)

    if (!cwd) {
      return
    }

    return tryThenMaybeForce(internalCommands, commandId, cwd)
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

    return gitUnstageAll(cwd)
  }

export const getCommitRootCommand =
  (
    repositories: WorkspaceRepositories,
    internalCommands: InternalCommands
  ): RootCommand =>
  async context => {
    const cwd = await repositories.getCwd(context?.rootUri)

    if (!cwd) {
      return
    }

    await tryThenMaybeForce(internalCommands, AvailableCommands.COMMIT, cwd)
    return commands.executeCommand('workbench.scm.focus')
  }

export const getResetRootCommand =
  (
    repositories: WorkspaceRepositories,
    internalCommands: InternalCommands
  ): RootCommand =>
  async context => {
    const cwd = await repositories.getCwd(context?.rootUri)

    if (!cwd) {
      return
    }

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
