import { commands } from 'vscode'
import { Config } from '../Config'
import { Disposer } from '../extension'
import { initializeDirectory } from './executor'
import {
  applyExperimentFromQuickPick,
  branchExperimentFromQuickPick,
  experimentGcQuickPick,
  experimentRunQueueCommand,
  removeExperimentFromQuickPick
} from './vscode'

export const registerCliCommands = (config: Config, disposer: Disposer) => {
  disposer.track(
    commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
      initializeDirectory({
        cwd: fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    })
  )

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
