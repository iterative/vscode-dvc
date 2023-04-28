import { Progress, commands } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { Toast } from '../../vscode/toast'
import { WorkspaceExperiments } from '../workspace'
import { Setup } from '../../setup'
import { RegisteredCommands } from '../../commands/external'

export const getBranchExperimentCommand =
  (experiments: WorkspaceExperiments) =>
  (cwd: string, name: string, input: string) =>
    experiments.runCommand(
      AvailableCommands.EXPERIMENT_BRANCH,
      cwd,
      name,
      input
    )

const applyAndPush = async (
  internalCommands: InternalCommands,
  progress: Progress<{ increment: number; message: string }>,
  cwd: string,
  name: string
): Promise<void> => {
  await Toast.runCommandAndIncrementProgress(
    () =>
      internalCommands.executeCommand(
        AvailableCommands.EXPERIMENT_APPLY,
        cwd,
        name
      ),
    progress,
    25
  )

  return Toast.runCommandAndIncrementProgress(
    () => internalCommands.executeCommand(AvailableCommands.PUSH, cwd),
    progress,
    25
  )
}

export const getShareExperimentAsBranchCommand =
  (internalCommands: InternalCommands) =>
  async (cwd: string, name: string, input: string) => {
    await Toast.showProgress('Sharing Branch', async progress => {
      progress.report({ increment: 0 })

      await Toast.runCommandAndIncrementProgress(
        () =>
          internalCommands.executeCommand(
            AvailableCommands.EXPERIMENT_BRANCH,
            cwd,
            name,
            input
          ),
        progress,
        25
      )

      await applyAndPush(internalCommands, progress, cwd, name)

      await Toast.runCommandAndIncrementProgress(
        () =>
          internalCommands.executeCommand(
            AvailableCommands.GIT_PUSH_BRANCH,
            cwd,
            input
          ),
        progress,
        25
      )

      return Toast.delayProgressClosing()
    })
  }

export const getShareExperimentAsCommitCommand =
  (internalCommands: InternalCommands) =>
  async (cwd: string, name: string, input: string) => {
    await Toast.showProgress('Sharing Commit', async progress => {
      progress.report({ increment: 0 })

      await applyAndPush(internalCommands, progress, cwd, name)

      await Toast.runCommandAndIncrementProgress(
        () =>
          internalCommands.executeCommand(
            AvailableCommands.GIT_STAGE_AND_COMMIT,
            cwd,
            input
          ),
        progress,
        25
      )

      await Toast.runCommandAndIncrementProgress(
        () =>
          internalCommands.executeCommand(
            AvailableCommands.GIT_PUSH_BRANCH,
            cwd
          ),
        progress,
        25
      )

      return Toast.delayProgressClosing()
    })
  }

export const getShareExperimentToStudioCommand =
  (internalCommands: InternalCommands, setup: Setup) =>
  ({ dvcRoot, id }: { dvcRoot: string; id: string }) => {
    const studioAccessToken = setup.getStudioAccessToken()
    if (!studioAccessToken) {
      return commands.executeCommand(RegisteredCommands.SETUP_SHOW)
    }

    return Toast.showProgress('Sharing', async progress => {
      progress.report({ increment: 0 })

      progress.report({ increment: 25, message: 'Running exp push...' })

      await Toast.runCommandAndIncrementProgress(
        () =>
          internalCommands.executeCommand(
            AvailableCommands.EXPERIMENT_PUSH,
            dvcRoot,
            id
          ),
        progress,
        75
      )

      return Toast.delayProgressClosing(15000)
    })
  }
