import { commands } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
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

const getExperiment = async (config: Config, experiments: Experiments) => {
  const dvcRoot = await getDvcRoot(config)
  if (!dvcRoot) {
    return
  }

  const exps = experiments.getExperiment(dvcRoot)
  await exps?.showWebview()
  return exps
}

export const getExperimentsThenRun = async (
  config: Config,
  experiments: Experiments,
  runner: Runner,
  disposer: Disposer,
  func: typeof run | typeof runQueued | typeof runReset
) => {
  const exps = await getExperiment(config, experiments)
  if (!exps) {
    return
  }

  func(runner, exps.getDvcRoot())
  const listener = disposer.track(
    runner.onDidCompleteProcess(() => {
      exps.refresh()
      disposer.untrack(listener)
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
      getExperimentsThenRun(config, experiments, runner, disposer, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      getExperimentsThenRun(config, experiments, runner, disposer, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      getExperimentsThenRun(config, experiments, runner, disposer, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      getExperiment(config, experiments)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () => stop(runner))
  )

  return disposer
}
