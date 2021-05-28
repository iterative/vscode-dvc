import { commands } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { applyExperiment, queueExperiment, removeExperiment } from './report'
import { branchExperiment, garbageCollectExperiments } from './quickPick'
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

export const getExperimentListThenRun = async (
  experiments: Experiments,
  func: (options: ExecutionOptions, experimentName: string) => Promise<unknown>
) => {
  const obj = await experiments.getExperimentName()
  const options = obj?.options
  const name = await obj?.name
  if (!(name && options)) {
    return
  }
  return func(options, name)
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
      getExperimentListThenRun(experiments, applyExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      getExperimentListThenRun(experiments, branchExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      getExperimentListThenRun(experiments, removeExperiment)
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

export const registerExperimentRunnerCommands = (
  experiments: Experiments,
  cliRunner: CliRunner
): Disposable => {
  const disposer = Disposable.fn()

  disposer.track(
    commands.registerCommand('dvc.runExperiment', () =>
      showExperimentsTableThenRun(experiments, cliRunner, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      showExperimentsTableThenRun(experiments, cliRunner, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      showExperimentsTableThenRun(experiments, cliRunner, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () => stop(cliRunner))
  )

  return disposer
}
