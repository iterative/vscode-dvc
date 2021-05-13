import { window } from 'vscode'
import { GcPreserveFlag } from '../../cli/args'
import { ExecutionOptions } from '../../cli/execution'
import {
  experimentApply,
  experimentBranch,
  experimentGarbageCollect,
  experimentRemove
} from '../../cli/executor'
import { experimentListCurrent } from '../../cli/reader'
import { quickPickManyValues } from '../../vscode/quickPick'
import { reportStderrOrThrow } from '../../vscode/reporting'

export const garbageCollectExperiments = async (options: ExecutionOptions) => {
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
      const stdout = await experimentGarbageCollect(options, quickPickResult)
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
  options: ExecutionOptions,
  callback: (
    options: ExecutionOptions,
    selectedExperiment: string
  ) => Promise<T>
) => {
  try {
    const selectedExperimentName = await experimentsQuickPick(options)
    if (selectedExperimentName) {
      return callback(options, selectedExperimentName)
    }
  } catch (e) {
    reportStderrOrThrow(e)
  }
}

export const applyExperiment = (options: ExecutionOptions) =>
  experimentsQuickPickCommand(
    options,
    async (options, selectedExperimentName) => {
      window.showInformationMessage(
        await experimentApply(options, selectedExperimentName)
      )
    }
  )

export const removeExperiment = (options: ExecutionOptions) =>
  experimentsQuickPickCommand(
    options,
    async (options, selectedExperimentName) => {
      await experimentRemove(options, selectedExperimentName)
      window.showInformationMessage(
        `Experiment ${selectedExperimentName} has been removed!`
      )
    }
  )

export const branchExperiment = (options: ExecutionOptions) =>
  experimentsQuickPickCommand(
    options,
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
