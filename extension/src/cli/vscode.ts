import { window } from 'vscode'
import { Config } from '../Config'
import { GcPreserveFlag } from './args'
import { quickPickManyValues } from '../vscode/quickpick'
import { reportStderrOrThrow } from '../vscode/reporting'
import {
  experimentListCurrent,
  experimentApply,
  experimentBranch,
  experimentRemove
} from './reader'
import { experimentGarbageCollect, queueExperiment } from './writer'
import { ExecutionOptions } from './execution'

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

const experimentsQuickPick = async (options: ExecutionOptions) => {
  const experiments = await experimentListCurrent(options)

  if (experiments.length === 0) {
    window.showErrorMessage('There are no experiments to select!')
  } else {
    return window.showQuickPick(experiments)
  }
}

const experimentsQuickPickCommand = async <T = void>(
  config: Config,
  callback: (
    options: ExecutionOptions,
    selectedExperiment: string
  ) => Promise<T>
) => {
  const options = {
    cwd: config.workspaceRoot,
    cliPath: config.dvcPath,
    pythonBinPath: config.pythonBinPath
  }
  try {
    const selectedExperimentName = await experimentsQuickPick(options)
    if (selectedExperimentName) {
      return callback(options, selectedExperimentName)
    }
  } catch (e) {
    reportStderrOrThrow(e)
  }
}

export const applyExperimentFromQuickPick = async (config: Config) =>
  experimentsQuickPickCommand(
    config,
    async (options, selectedExperimentName) => {
      window.showInformationMessage(
        await experimentApply(options, selectedExperimentName)
      )
    }
  )

export const removeExperimentFromQuickPick = async (config: Config) =>
  experimentsQuickPickCommand(
    config,
    async (options, selectedExperimentName) => {
      await experimentRemove(options, selectedExperimentName)
      window.showInformationMessage(
        `Experiment ${selectedExperimentName} has been removed!`
      )
    }
  )

export const branchExperimentFromQuickPick = async (config: Config) =>
  experimentsQuickPickCommand(
    config,
    async (options, selectedExperimentName) => {
      const branchName = await window.showInputBox({
        prompt: 'Name the new branch'
      })
      if (branchName) {
        window.showInformationMessage(
          await experimentBranch(options, selectedExperimentName, branchName)
        )
      }
    }
  )
