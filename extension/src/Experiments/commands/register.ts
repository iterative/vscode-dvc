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
import { pickDvcRootThenRun, pickDvcRoot } from '../../fileSystem/workspace'
import { Experiments } from '..'
import { Runner } from '../../cli/Runner'

const pickExperimentsThenRun = async (
  experiments: Record<string, Experiments>,
  config: Config,
  runner?: Runner,
  method?: typeof run | typeof runQueued | typeof runReset
) => {
  const dvcRoot = await pickDvcRoot(config)
  if (dvcRoot) {
    const pickedExperiments = experiments[dvcRoot]
    pickedExperiments?.showWebview()
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
      pickDvcRootThenRun(config, queueExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      pickDvcRootThenRun(config, garbageCollectExperiments)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      pickDvcRootThenRun(config, applyExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      pickDvcRootThenRun(config, branchExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      pickDvcRootThenRun(config, removeExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runExperiment', () =>
      pickExperimentsThenRun(experiments, config, runner, run)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      pickExperimentsThenRun(experiments, config, runner, runReset)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      pickExperimentsThenRun(experiments, config, runner, runQueued)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      pickExperimentsThenRun(experiments, config)
    )
  )

  disposer.track(commands.registerCommand('dvc.stopRunningExperiment', stop))
}
