import { AvailableCommands } from '../../commands/internal'
import { gitPushBranch } from '../../git'
import { Toast } from '../../vscode/toast'
import { WorkspaceExperiments } from '../workspace'

export const getBranchExperimentCommand =
  (experiments: WorkspaceExperiments) =>
  (cwd: string, name: string, input: string) =>
    experiments.runCommand(
      AvailableCommands.EXPERIMENT_BRANCH,
      cwd,
      name,
      input
    )

export const getShareExperimentAsBranchCommand =
  (experiments: WorkspaceExperiments) =>
  async (cwd: string, name: string, input: string) => {
    const branchCommand = getBranchExperimentCommand(experiments)
    await branchCommand(cwd, name, input)

    await experiments.runCommand(AvailableCommands.EXPERIMENT_APPLY, cwd, name)

    await experiments.runCommand(AvailableCommands.PUSH, cwd)

    return Toast.showOutput(gitPushBranch(cwd, input))
  }
