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
  experimentApply,
  experimentBranch,
  experimentRemove
} from './reader'
import { ReaderOptions } from './executionDetails'

const reportStderrOrThrow = (
  error: Error & { stdout?: string; stderr?: string }
) => {
  if (error.stderr) {
    return window.showErrorMessage(error.stderr)
  }
  throw error
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
    reportStderrOrThrow(e)
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
          cliPath: config.dvcPath,
          pythonBinPath: config.pythonBinPath
        },
        quickPickResult
      )
      window.showInformationMessage(stdout)
    } catch (e) {
      reportStderrOrThrow(e)
    }
  }
}

const experimentsQuickPick = async (readerOptions: ReaderOptions) => {
  const experiments = await experimentListCurrent(readerOptions)

  if (experiments.length === 0) {
    window.showErrorMessage('There are no experiments to select!')
  } else {
    return window.showQuickPick(experiments)
  }
}

const experimentsQuickPickCommand = async <T = void>(
  config: Config,
  callback: (
    readerOptions: ReaderOptions,
    selectedExperiment: string
  ) => Promise<T>
) => {
  const readerOptions = {
    cwd: config.workspaceRoot,
    cliPath: config.dvcPath,
    pythonBinPath: config.pythonBinPath
  }
  try {
    const selectedExperimentName = await experimentsQuickPick(readerOptions)
    if (selectedExperimentName) {
      return callback(readerOptions, selectedExperimentName)
    }
  } catch (e) {
    reportStderrOrThrow(e)
  }
}

export const applyExperimentFromQuickPick = async (config: Config) =>
  experimentsQuickPickCommand(
    config,
    async (readerOptions, selectedExperimentName) => {
      window.showInformationMessage(
        await experimentApply(readerOptions, selectedExperimentName)
      )
    }
  )

export const removeExperimentFromQuickPick = async (config: Config) =>
  experimentsQuickPickCommand(
    config,
    async (readerOptions, selectedExperimentName) => {
      window.showInformationMessage(
        await experimentRemove(readerOptions, selectedExperimentName)
      )
    }
  )

export const branchExperimentFromQuickPick = async (config: Config) =>
  experimentsQuickPickCommand(
    config,
    async (readerOptions, selectedExperimentName) => {
      const branchName = await window.showInputBox({
        prompt: 'Name the new branch'
      })
      if (branchName) {
        window.showInformationMessage(
          await experimentBranch(
            readerOptions,
            selectedExperimentName,
            branchName
          )
        )
      }
    }
  )

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
