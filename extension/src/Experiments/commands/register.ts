import { commands } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../../Config'
import { queueExperiment } from './report'
import {
  applyExperiment,
  branchExperiment,
  garbageCollectExperiments,
  removeExperiment
} from './quickPick'
import { run, runQueued, runReset, stop } from './runner'
import { getDvcRootThenRun } from '../../fileSystem/workspace'
import { Experiments } from '..'
import { Runner } from '../../cli/Runner'

export const showExperimentThenRun = async (
  experiments: Experiments,
  runner: Runner,
  func: typeof run | typeof runQueued | typeof runReset
) => {
  const experiment = await experiments.showExperiment()
  if (!experiment) {
    return
  }

  func(runner, experiment.getDvcRoot())
  const listener = experiments.dispose.track(
    runner.onDidCompleteProcess(() => {
      experiment.refresh()
      experiments.dispose.untrack(listener)
      listener.dispose()
    })
  )
}

export const registerExperimentCommands = (
  config: Config,
  experiments: Experiments,
  runner: Runner
) => {
  const disposer = Disposable.fn()

  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      getDvcRootThenRun(config, queueExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      getDvcRootThenRun(config, garbageCollectExperiments)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      getDvcRootThenRun(config, applyExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      getDvcRootThenRun(config, branchExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      getDvcRootThenRun(config, removeExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runExperiment', () =>
      showExperimentThenRun(experiments, runner, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      showExperimentThenRun(experiments, runner, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      showExperimentThenRun(experiments, runner, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      experiments.showExperiment()
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () => stop(runner))
  )

  return disposer
}
