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
import {
  pickRepoThenRun,
  pickSingleRepositoryRoot
} from '../../fileSystem/workspace'
import { Command, ExperimentFlag, ExperimentSubCommands } from '../../cli/args'
import { Experiments } from '..'

const registerExperimentCommand = (
  experiments: Record<string, Experiments>,
  details: {
    registeredName: string
    method: 'stop' | 'run' | 'showWebview'
    args?: (Command | ExperimentSubCommands | ExperimentFlag)[]
    config: Config
  }
) => {
  const { registeredName, method, args, config } = details
  return commands.registerCommand(registeredName, async () => {
    const dvcRoot = await pickSingleRepositoryRoot(config)

    if (dvcRoot && experiments[dvcRoot]) {
      return experiments[dvcRoot][method](...(args || []))
    }
  })
}

export const registerExperimentCommands = (
  experiments: Record<string, Experiments>,
  config: Config,
  disposer: Disposer
) => {
  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      pickRepoThenRun(config, queueExperiment)
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

  disposer.track(
    registerExperimentCommand(experiments, {
      registeredName: 'dvc.runExperiment',
      method: 'run',
      args: [Command.EXPERIMENT, ExperimentSubCommands.RUN],
      config
    })
  )

  disposer.track(
    registerExperimentCommand(experiments, {
      config,
      registeredName: 'dvc.runResetExperiment',
      method: 'run',
      args: [
        Command.EXPERIMENT,
        ExperimentSubCommands.RUN,
        ExperimentFlag.RESET
      ]
    })
  )

  disposer.track(
    registerExperimentCommand(experiments, {
      config,
      registeredName: 'dvc.runQueuedExperiments',
      method: 'run',
      args: [
        Command.EXPERIMENT,
        ExperimentSubCommands.RUN,
        ExperimentFlag.RUN_ALL
      ]
    })
  )

  disposer.track(
    registerExperimentCommand(experiments, {
      config,
      registeredName: 'dvc.showExperiments',
      method: 'showWebview'
    })
  )

  disposer.track(
    registerExperimentCommand(experiments, {
      config,
      registeredName: 'dvc.stopRunningExperiment',
      method: 'stop'
    })
  )
}
