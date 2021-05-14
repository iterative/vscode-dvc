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
import { getDvcRoot, getDvcRootThenRun } from '../../fileSystem/workspace'
import { Experiments } from '..'

const getExperimentsThenRun = async (
  config: Config,
  experiments: Record<string, Experiments>,
  activeExperiments: string | undefined,
  method: 'stop' | 'run' | 'runQueued' | 'runReset' | 'showWebview'
) => {
  if (activeExperiments) {
    const pickedExperiments = experiments[activeExperiments]
    return pickedExperiments?.[method]()
  }

  const dvcRoot = await getDvcRoot(config)
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
      getExperimentsThenRun(config, experiments, activeExperiments, 'run')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      getExperimentsThenRun(config, experiments, activeExperiments, 'runReset')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      getExperimentsThenRun(config, experiments, activeExperiments, 'runQueued')
    )
  )

  disposer.track(
    commands.registerCommand('dvc.showExperiments', () =>
      getExperimentsThenRun(
        config,
        experiments,
        activeExperiments,
        'showWebview'
      )
    )
  )

  disposer.track(
    commands.registerCommand('dvc.stopRunningExperiment', () =>
      getExperimentsThenRun(config, experiments, activeExperiments, 'stop')
    )
  )
}
