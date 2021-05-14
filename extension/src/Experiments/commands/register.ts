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

const getExperiments = async (
  experiments: Record<string, Experiments>,
  config: Config
) => {
  const dvcRoot = await getDvcRoot(config)
  if (dvcRoot) {
    const pickedExperiments = experiments[dvcRoot]
    await pickedExperiments?.showWebview()
    return pickedExperiments
  }
}

export const getExperimentsThenRun = async (
  experiments: Record<string, Experiments>,
  config: Config,
  runner: Runner,
  disposer: Disposer,
  func: typeof run | typeof runQueued | typeof runReset
) => {
  const exps = await getExperiments(experiments, config)
  if (exps) {
    func(runner, exps.getDvcRoot())
    const listener = disposer.track(
      runner.onDidCompleteProcess(() => {
        exps.refresh()
        disposer.untrack(listener)
        listener.dispose()
      })
    )
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
      getExperimentsThenRun(experiments, config, runner, disposer, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      getExperimentsThenRun(experiments, config, runner, disposer, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      getExperimentsThenRun(experiments, config, runner, disposer, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      getExperiments(experiments, config)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () => stop(runner))
  )
}
