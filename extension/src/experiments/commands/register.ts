import { commands } from 'vscode'
import { pickGarbageCollectionFlags } from '../quickPick'
import { runQueued, runReset, stop } from '../runner'
import { Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { AvailableCommands } from '../../internalCommands'

const registerExperimentCwdCommands = (experiments: Experiments): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN_QUEUE)
    )
  )
}

const registerExperimentNameCommands = (experiments: Experiments): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_APPLY)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_REMOVE)
    )
  )
}

const registerExperimentInputCommands = (experiments: Experiments): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      experiments.getExpNameAndInputThenRun(
        AvailableCommands.EXPERIMENT_BRANCH,
        'Name the new branch'
      )
    )
  )
}

const registerExperimentQuickPickCommands = (
  experiments: Experiments
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      experiments.getCwdAndQuickPickThenRun(
        AvailableCommands.EXPERIMENT_GARBAGE_COLLECT,
        pickGarbageCollectionFlags
      )
    )
  )
}

const registerExperimentExecutorCommands = (experiments: Experiments): void => {
  registerExperimentCwdCommands(experiments)
  registerExperimentNameCommands(experiments)
  registerExperimentInputCommands(experiments)
  registerExperimentQuickPickCommands(experiments)
}

const registerExperimentRunnerCommands = (
  experiments: Experiments,
  cliRunner: CliRunner
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.runExperiment', () =>
      experiments.showExperimentsTableThenRun_(AvailableCommands.RUN_EXPERIMENT)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      experiments.showExperimentsTableThenRun(cliRunner, runReset)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      experiments.showExperimentsTableThenRun(cliRunner, runQueued)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.stopRunningExperiment', () => stop(cliRunner))
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.showExperiments', () =>
      experiments.showExperimentsTable()
    )
  )
}

export const registerExperimentCommands = (
  experiments: Experiments,
  cliRunner: CliRunner
) => {
  registerExperimentExecutorCommands(experiments)
  registerExperimentRunnerCommands(experiments, cliRunner)
}
