import { commands } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { Toast } from '../../vscode/toast'
import { WorkspaceExperiments } from '../workspace'
import { Setup } from '../../setup'
import { RegisteredCommands } from '../../commands/external'

export const getBranchExperimentCommand =
  (experiments: WorkspaceExperiments) =>
  (cwd: string, name: string, input: string) =>
    experiments.runCommand(AvailableCommands.EXP_BRANCH, cwd, name, input)

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
            AvailableCommands.EXP_PUSH,
            dvcRoot,
            id
          ),
        progress,
        75
      )

      return Toast.delayProgressClosing(15000)
    })
  }
