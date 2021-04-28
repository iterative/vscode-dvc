import { commands } from 'vscode'
import { addTarget, commitTarget } from '.'
import { Config } from '../Config'
import { Disposer } from '../extension'
import {
  checkout,
  checkoutTarget,
  commit,
  initializeDirectory,
  pullTarget,
  pushTarget
} from './writer'
import {
  applyExperimentFromQuickPick,
  branchExperimentFromQuickPick,
  experimentGcQuickPick,
  queueExperimentCommand,
  removeExperimentFromQuickPick
} from './vscode'

const registerCommands = (config: Config, disposer: Disposer) => {
  disposer.track(
    commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
      initializeDirectory({
        cwd: fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.addTarget', ({ resourceUri }) =>
      addTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.checkout', ({ rootUri }) => {
      checkout({
        cwd: rootUri.fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.checkoutTarget', ({ resourceUri }) =>
      checkoutTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.commit', ({ rootUri }) => {
      commit({
        cwd: rootUri.fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.commitTarget', ({ resourceUri }) =>
      commitTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.pushTarget', ({ resourceUri }) =>
      pushTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.pullTarget', ({ resourceUri }) =>
      pullTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      queueExperimentCommand(config)
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

export default registerCommands
