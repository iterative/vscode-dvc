import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../../Config'
import { experimentRunQueueCommand } from './message'
import {
  applyExperimentFromQuickPick,
  branchExperimentFromQuickPick,
  experimentGcQuickPick,
  removeExperimentFromQuickPick
} from './quickPick'
import { pickSingleRepositoryRoot } from '../../fileSystem'

export const pickRepoThenRun = async (
  config: Config,
  func: (config: Config) => unknown
) => {
  const dvcRoot = await pickSingleRepositoryRoot(config)
  if (dvcRoot) {
    return func(config)
  }
}

export const registerExperimentCommands = (
  config: Config,
  disposer: Disposer
) => {
  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      pickRepoThenRun(config, experimentRunQueueCommand)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      pickRepoThenRun(config, experimentGcQuickPick)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      pickRepoThenRun(config, applyExperimentFromQuickPick)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      pickRepoThenRun(config, branchExperimentFromQuickPick)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      pickRepoThenRun(config, removeExperimentFromQuickPick)
    )
  )
}
