import { commands } from 'vscode'
import { getGarbageCollectionFlags } from '../quickPick'
import { run, runQueued, runReset, stop } from './runner'
import { Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { CliExecutor } from '../../cli/executor'

const registerExperimentCwdCommands = (
  experiments: Experiments,
  cliExecutor: CliExecutor
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      experiments.getCwdThenRun(cliExecutor.experimentRunQueue)
    )
  )
}

const registerExperimentNameCommands = (
  experiments: Experiments,
  cliExecutor: CliExecutor
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      experiments.getExpNameThenRun(cliExecutor.experimentApply)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      experiments.getExpNameThenRun(cliExecutor.experimentRemove)
    )
  )
}

const registerExperimentInputCommands = (
  experiments: Experiments,
  cliExecutor: CliExecutor
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      experiments.getExpNameAndInputThenRun(
        cliExecutor.experimentBranch,
        'Name the new branch'
      )
    )
  )
}

const registerExperimentQuickPickCommands = (
  experiments: Experiments,
  cliExecutor: CliExecutor
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      experiments.getCwdAndQuickPickThenRun(
        cliExecutor.experimentGarbageCollect,
        getGarbageCollectionFlags
      )
    )
  )
}

const registerExperimentExecutorCommands = (
  experiments: Experiments,
  cliExecutor: CliExecutor
): void => {
  registerExperimentCwdCommands(experiments, cliExecutor)
  registerExperimentNameCommands(experiments, cliExecutor)
  registerExperimentInputCommands(experiments, cliExecutor)
  registerExperimentQuickPickCommands(experiments, cliExecutor)
}

const registerExperimentRunnerCommands = (
  experiments: Experiments,
  cliRunner: CliRunner
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.runExperiment', () =>
      experiments.showExperimentsTableThenRun(cliRunner, run)
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
  cliExecutor: CliExecutor,
  cliRunner: CliRunner
) => {
  registerExperimentExecutorCommands(experiments, cliExecutor)
  registerExperimentRunnerCommands(experiments, cliRunner)
}
