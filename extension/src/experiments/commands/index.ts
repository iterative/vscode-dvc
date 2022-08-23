import { AvailableCommands } from '../../commands/internal'
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

    return experiments.runCommand(AvailableCommands.GIT_PUSH_BRANCH, cwd, input)
  }

export const getShareExperimentAsCommitCommand =
  (experiments: WorkspaceExperiments) =>
  async (cwd: string, name: string, input: string) => {
    await experiments.runCommand(AvailableCommands.EXPERIMENT_APPLY, cwd, name)

    await experiments.runCommand(
      AvailableCommands.GIT_STAGE_AND_COMMIT,
      cwd,
      input
    )

    await experiments.runCommand(AvailableCommands.PUSH, cwd)

    return experiments.runCommand(AvailableCommands.GIT_PUSH_BRANCH, cwd)
  }
