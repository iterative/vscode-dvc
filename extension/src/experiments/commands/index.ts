import { AvailableCommands, InternalCommands } from '../../commands/internal'
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

    return experiments.runCommand(AvailableCommands.GIT_PUSH_BRANCH, cwd, input)
  }

export const getShareExperimentAsCommitCommand =
  (internalCommands: InternalCommands) =>
  async (cwd: string, name: string, input: string) => {
    await Toast.showProgress('Commit and Share experiment', async progress => {
      progress.report({ increment: 0 })

      progress.report({
        increment: 5,
        message: 'applying experiment to workspace...'
      })

      const experimentApplied = await internalCommands.executeCommand(
        AvailableCommands.EXPERIMENT_APPLY,
        cwd,
        name
      )

      progress.report({
        increment: 20,
        message: experimentApplied
      })

      progress.report({
        increment: 5,
        message: 'committing to Git...'
      })

      const gitCommitted = await internalCommands.executeCommand(
        AvailableCommands.GIT_STAGE_AND_COMMIT,
        cwd,
        input
      )

      progress.report({
        increment: 20,
        message: gitCommitted
      })

      progress.report({
        increment: 5,
        message: 'pushing data to DVC remote...'
      })

      const pushed = await internalCommands.executeCommand(
        AvailableCommands.PUSH,
        cwd
      )

      progress.report({
        increment: 20,
        message: pushed
      })

      const branchPushed = internalCommands.executeCommand(
        AvailableCommands.GIT_PUSH_BRANCH,
        cwd
      )

      progress.report({
        increment: 5,
        message: 'pushing branch to Git remote...'
      })

      progress.report({
        increment: 25,
        message: await branchPushed
      })

      return branchPushed
    })
  }
