import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../../Config'
import { queueExperiment } from './message'
import {
  applyExperiment,
  branchExperiment,
  garbageCollectExperiments,
  removeExperiment
} from './quickPick'
import { runWithDvcRoot, getDvcRoot } from '../../fileSystem/workspace'
import { Experiments } from '..'

const pickExperimentsThenRun = async (
  config: Config,
  experiments: Record<string, Experiments>,
  method: 'stop' | 'run' | 'runQueued' | 'runReset' | 'showWebview'
) => {
  const dvcRoot = await getDvcRoot(config)
  if (dvcRoot) {
    const pickedExperiments = experiments[dvcRoot]
    return pickedExperiments?.[method]()
  }
}

export const registerExperimentCommands = (
  experiments: Record<string, Experiments>,
  config: Config,
  disposer: Disposer
) => {
  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      runWithDvcRoot(config, queueExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      runWithDvcRoot(config, garbageCollectExperiments)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      runWithDvcRoot(config, applyExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      runWithDvcRoot(config, branchExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      runWithDvcRoot(config, removeExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runExperiment', () =>
      pickExperimentsThenRun(config, experiments, 'run')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      pickExperimentsThenRun(config, experiments, 'runReset')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      pickExperimentsThenRun(config, experiments, 'runQueued')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      pickExperimentsThenRun(config, experiments, 'showWebview')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () =>
      pickExperimentsThenRun(config, experiments, 'stop')
    )
  )
}
