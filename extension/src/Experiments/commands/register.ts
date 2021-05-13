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
import { pickDvcRootThenRun, pickDvcRoot } from '../../fileSystem/workspace'
import { Experiments } from '..'

const pickExperimentsThenRun = async (
  config: Config,
  experiments: Record<string, Experiments>,
  activeExperiments: string | undefined,
  method: 'stop' | 'run' | 'runQueued' | 'runReset' | 'showWebview'
) => {
  if (activeExperiments) {
    const pickedExperiments = experiments[activeExperiments]
    return pickedExperiments?.[method]()
  }
  const dvcRoot = await pickDvcRoot(config)
  if (dvcRoot) {
    const pickedExperiments = experiments[dvcRoot]
    return pickedExperiments?.[method]()
  }
}

export const registerExperimentCommands = (
  experiments: Record<string, Experiments>,
  activeExperiments: string | undefined,
  config: Config,
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
      pickExperimentsThenRun(config, experiments, activeExperiments, 'run')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      pickExperimentsThenRun(config, experiments, activeExperiments, 'runReset')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      pickExperimentsThenRun(
        config,
        experiments,
        activeExperiments,
        'runQueued'
      )
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      pickExperimentsThenRun(
        config,
        experiments,
        activeExperiments,
        'showWebview'
      )
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () =>
      pickExperimentsThenRun(config, experiments, activeExperiments, 'stop')
    )
  )
}
