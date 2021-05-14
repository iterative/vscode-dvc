import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../../Config'
import { queueExperiment } from './report'
import {
  applyExperiment,
  branchExperiment,
  garbageCollectExperiments,
  removeExperiment
} from './quickPick'
import { run, runQueued, runReset, stop } from './runner'
import { getDvcRoot, getDvcRootThenRun } from '../../fileSystem/workspace'
import { Experiments } from '..'
import { Runner } from '../../cli/Runner'

export const getExperimentsThenRun = async (
  experiments: Record<string, Experiments>,
  config: Config,
  runner?: Runner,
  method?: typeof run | typeof runQueued | typeof runReset
) => {
  const dvcRoot = await getDvcRoot(config)
  if (dvcRoot) {
    const pickedExperiments = experiments[dvcRoot]
    await pickedExperiments?.showWebview()
    if (method && runner) {
      return method(runner, dvcRoot)
    }
  }
}

export const registerExperimentCommands = (
  experiments: Record<string, Experiments>,
  config: Config,
  runner: Runner,
  disposer: Disposer
) => {
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
      getExperimentsThenRun(experiments, config, runner, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      getExperimentsThenRun(experiments, config, runner, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      getExperimentsThenRun(experiments, config, runner, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      getExperimentsThenRun(experiments, config)
    )
  )

  disposer.track(commands.registerCommand('dvc.stopRunningExperiment', stop))
}
