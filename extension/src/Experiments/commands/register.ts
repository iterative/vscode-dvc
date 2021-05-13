import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../../Config'
import { experimentRunQueueCommand } from './message'
import {
  applyExperiment,
  branchExperiment,
  garbageCollectExperiments,
  removeExperiment
} from './quickPick'
import { pickSingleRepositoryRoot } from '../../fileSystem'
import { ExecutionOptions } from '../../cli/execution'

export const pickRepoThenRun = async (
  config: Config,
  func: (options: ExecutionOptions) => unknown
) => {
  const dvcRoot = await pickSingleRepositoryRoot(config)
  if (dvcRoot) {
    const options = { ...config.getExecutionOptions(), cwd: dvcRoot }
    return func(options)
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
      pickRepoThenRun(config, garbageCollectExperiments)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      pickRepoThenRun(config, applyExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      pickRepoThenRun(config, branchExperiment)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      pickRepoThenRun(config, removeExperiment)
    )
  )
}
