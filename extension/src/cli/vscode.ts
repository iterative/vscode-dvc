import { commands, QuickPickItem, window } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { pushTarget, pullTarget, addTarget } from '.'
import { Config } from '../Config'
import { GcPreserveFlag } from './commands'
import {
  initializeDirectory,
  checkout,
  checkoutRecursive,
  queueExperiment,
  experimentGarbageCollect
} from './reader'

export interface GcQuickPickItem extends QuickPickItem {
  flag: GcPreserveFlag
}

export const queueExperimentCommand = async (config: Config) => {
  try {
    return window.showInformationMessage(
      await queueExperiment({
        cwd: config.workspaceRoot,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    )
  } catch (e) {
    return window.showErrorMessage(e.stderr || e.message)
  }
}

export const experimentGcCommand = async (config: Config) => {
  const quickPickResult = await window.showQuickPick<GcQuickPickItem>(
    [
      {
        label: 'All Branches',
        detail: 'Preserve Experiments derived from all Git branches',
        flag: GcPreserveFlag.ALL_BRANCHES
      },
      {
        label: 'All Tags',
        detail: 'Preserve Experiments derived from all Git tags',
        flag: GcPreserveFlag.ALL_TAGS
      },
      {
        label: 'All Commits',
        detail: 'Preserve Experiments derived from all Git commits',
        flag: GcPreserveFlag.ALL_COMMITS
      },
      {
        label: 'Queued Experiments',
        detail: 'Preserve all queued Experiments',
        flag: GcPreserveFlag.QUEUED
      }
    ],
    { canPickMany: true, placeHolder: 'Select which Experiments to preserve' }
  )

  if (quickPickResult) {
    try {
      const stdout = await experimentGarbageCollect(
        {
          cwd: config.workspaceRoot,
          cliPath: config.dvcPath,
          pythonBinPath: config.pythonBinPath
        },
        quickPickResult.map(({ flag }) => flag)
      )
      window.showInformationMessage(stdout)
    } catch (e) {
      window.showErrorMessage(e.stderr || e.message)
    }
  }
}

export const registerCommands = (config: Config, disposer: Disposer) => {
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
    commands.registerCommand('dvc.checkout', ({ fsPath }) => {
      checkout({
        cwd: fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.checkoutRecursive', ({ fsPath }) => {
      checkoutRecursive({
        cwd: fsPath,
        cliPath: config.dvcPath,
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.queueExperiment', () => {
      return queueExperimentCommand(config)
    })
  )

  disposer.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () => {
      return experimentGcCommand(config)
    })
  )
}
