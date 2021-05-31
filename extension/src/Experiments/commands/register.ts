import { commands } from 'vscode'
import { report } from './report'
import { getGarbageCollectionFlags } from './quickPick'
import { run, runQueued, runReset, stop } from './runner'
import { Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { CliExecutor } from '../../cli/executor'

export const getCwdThenRun = async (
  experiments: Experiments,
  func: (cwd: string) => Promise<string>
) => {
  const cwd = await experiments.getCwd()
  if (!cwd) {
    return
  }

  report(func(cwd))
}

const registerExperimentCwdCommands = (
  experiments: Experiments,
  cliExecutor: CliExecutor
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      getCwdThenRun(experiments, cliExecutor.experimentRunQueue)
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

export const showExperimentsTableThenRun = async (
  experiments: Experiments,
  cliRunner: CliRunner,
  func: (cliRunner: CliRunner, dvcRoot: string) => Promise<void>
) => {
  const experimentsTable = await experiments.getExperimentsTableForCommand()
  if (!experimentsTable) {
    return
  }

  func(cliRunner, experimentsTable.getDvcRoot())
  const listener = experiments.dispose.track(
    cliRunner.onDidCompleteProcess(() => {
      experimentsTable.refresh()
      experiments.dispose.untrack(listener)
      listener.dispose()
    })
  )
}

const registerExperimentRunnerCommands = (
  experiments: Experiments,
  cliRunner: CliRunner
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.runExperiment', () =>
      showExperimentsTableThenRun(experiments, cliRunner, run)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      showExperimentsTableThenRun(experiments, cliRunner, runReset)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      showExperimentsTableThenRun(experiments, cliRunner, runQueued)
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
