import { window } from 'vscode'
import { GcPreserveFlag } from '../../cli/args'
import { ExecutionOptions } from '../../cli/execution'
import { experimentGarbageCollect } from '../../cli/executor'
import { quickPickManyValues } from '../../vscode/quickPick'
import { reportErrorMessage } from '../../vscode/reporting'

export const getBranchName = () =>
  window.showInputBox({
    prompt: 'Name the new branch'
  })

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
      reportErrorMessage(e)
    }
  }
}

export const pickExperimentName = (
  experimentNames: string[]
): Thenable<string | undefined> | undefined => {
  if (experimentNames.length === 0) {
    window.showErrorMessage('There are no experiments to select!')
  } else {
    return window.showQuickPick(experimentNames)
  }
}
