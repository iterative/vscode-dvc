import { commands, window } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { pushTarget, pullTarget, addTarget } from '.'
import { Config } from '../Config'
import { GcPreserveFlag } from './commands'
import { quickPickManyValues } from '../util/quickPick'
import {
  initializeDirectory,
  checkout,
  checkoutRecursive,
  queueExperiment,
  experimentGarbageCollect,
  experimentListCurrent,
  experimentApply
} from './reader'

export const queueExperimentCommand = async (config: Config) => {
  try {
    return window.showInformationMessage(
      await queueExperiment({
        cwd: config.workspaceRoot,
        cliPath: config.dvcPath
      })
    )
  } catch (e) {
    return window.showErrorMessage(e.stderr || e.message)
  }
}

export const experimentGcQuickPick = async (config: Config) => {
  const quickPickResult = await quickPickManyValues<GcPreserveFlag>(
    [
      {
        label: 'All Branches',
        detail: 'Preserve Experiments derived from all Git branches',
        value: GcPreserveFlag.ALL_BRANCHES
      },
      {
        label: 'All Tags',
        detail: 'Preserve Experiments derived from all Git tags',
        value: GcPreserveFlag.ALL_TAGS
      },
      {
        label: 'All Commits',
        detail: 'Preserve Experiments derived from all Git commits',
        value: GcPreserveFlag.ALL_COMMITS
      },
      {
        label: 'Queued Experiments',
        detail: 'Preserve all queued Experiments',
        value: GcPreserveFlag.QUEUED
      }
    ],
    { placeHolder: 'Select which Experiments to preserve' }
  )

  if (quickPickResult) {
    try {
      const stdout = await experimentGarbageCollect(
        {
          cwd: config.workspaceRoot,
          cliPath: config.dvcPath
        },
        quickPickResult
      )
      window.showInformationMessage(stdout)
    } catch (e) {
      if (e.stderr) {
        return window.showErrorMessage(e.stderr)
      }
      throw e
    }
  }
}

export const applyExperimentFromQuickPick = async (config: Config) => {
  const readerOptions = {
    cwd: config.workspaceRoot,
    cliPath: config.dvcPath
  }

  try {
    const experiments = await experimentListCurrent(readerOptions)

    if (experiments.length === 0) {
      window.showInformationMessage('There are no experiments to select!')
    } else {
      const selectedExperimentName = await window.showQuickPick(experiments)
      if (selectedExperimentName !== undefined) {
        window.showInformationMessage(
          await experimentApply(readerOptions, selectedExperimentName)
        )
      }
    }
  } catch (e) {
    if (e.stderr) {
      return window.showErrorMessage(e.stderr)
    }
    throw e
  }
}

export const registerCommands = (config: Config, disposer: Disposer) => {
  disposer.track(
    commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
      initializeDirectory({
        cwd: fsPath,
        cliPath: config.dvcPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.addTarget', ({ resourceUri }) =>
      addTarget({ fsPath: resourceUri.fsPath, cliPath: config.dvcPath })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.pushTarget', ({ resourceUri }) =>
      pushTarget({ fsPath: resourceUri.fsPath, cliPath: config.dvcPath })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.pullTarget', ({ resourceUri }) =>
      pullTarget({ fsPath: resourceUri.fsPath, cliPath: config.dvcPath })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.checkout', ({ fsPath }) => {
      checkout({ cwd: fsPath, cliPath: config.dvcPath })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.checkoutRecursive', ({ fsPath }) => {
      checkoutRecursive({ cwd: fsPath, cliPath: config.dvcPath })
    })
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
}
