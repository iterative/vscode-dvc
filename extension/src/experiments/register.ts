import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../Config'
import {
  applyExperimentFromQuickPick,
  branchExperimentFromQuickPick,
  experimentGcQuickPick,
  experimentRunQueueCommand,
  removeExperimentFromQuickPick
} from '../cli/vscode'

export const registerExperimentCommands = (
  config: Config,
  disposer: Disposer
) => {
  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      experimentRunQueueCommand(config)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      experimentGcQuickPick(config)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      applyExperimentFromQuickPick(config)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      branchExperimentFromQuickPick(config)
    )
  )

  disposer.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      removeExperimentFromQuickPick(config)
    )
  )
}
