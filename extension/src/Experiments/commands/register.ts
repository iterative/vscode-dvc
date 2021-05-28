import { commands } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { queueExperiment } from './report'
import {
  applyExperiment,
  branchExperiment,
  garbageCollectExperiments,
  removeExperiment
} from './quickPick'
import { run, runQueued, runReset, stop } from './runner'
import { Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { ExecutionOptions } from '../../cli/execution'

export const getExecutionOptionsThenRun = async (
  experiments: Experiments,
  func: (options: ExecutionOptions) => Promise<unknown>
) => {
  const options = await experiments.getExecutionOptions()
  if (!options) {
    return
  }
  return func(options)
}

export const registerExperimentCommands = (experiments: Experiments) => {
  const disposer = Disposable.fn()

  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      getExecutionOptionsThenRun(experiments, queueExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      getExecutionOptionsThenRun(experiments, garbageCollectExperiments)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      getExecutionOptionsThenRun(experiments, applyExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      getExecutionOptionsThenRun(experiments, branchExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      getExecutionOptionsThenRun(experiments, removeExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      experiments.showExperimentsTable()
    )
  )

  return disposer
}

export const showExperimentsTableThenRun = async (
  experiments: Experiments,
  runner: CliRunner,
  func: (runner: CliRunner, dvcRoot: string) => Promise<void>
) => {
  const experimentsTable = await experiments.getExperimentsTableForCommand()
  if (!experimentsTable) {
    return
  }

  func(runner, experimentsTable.getDvcRoot())
  const listener = experiments.dispose.track(
    runner.onDidCompleteProcess(() => {
      experimentsTable.refresh()
      experiments.dispose.untrack(listener)
      listener.dispose()
    })
  )
}

export const registerExperimentRunnerCommands = (
  experiments: Experiments,
  runner: CliRunner
): Disposable => {
  const disposer = Disposable.fn()

  disposer.track(
    commands.registerCommand('dvc.runExperiment', () =>
      showExperimentsTableThenRun(experiments, runner, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      showExperimentsTableThenRun(experiments, runner, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      showExperimentsTableThenRun(experiments, runner, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () => stop(runner))
  )

  return disposer
}
