import { commands } from 'vscode'
import { pickGarbageCollectionFlags } from '../quickPick'
import { Experiments } from '..'
import { AvailableCommands } from '../../internalCommands'

const registerExperimentCwdCommands = (experiments: Experiments): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.queueExperiment', () =>
      experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_QUEUE)
    )
  )
}

const registerExperimentNameCommands = (experiments: Experiments): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.applyExperiment', () =>
      experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_APPLY)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.removeExperiment', () =>
      experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_REMOVE)
    )
  )
}

const registerExperimentInputCommands = (experiments: Experiments): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.branchExperiment', () =>
      experiments.getExpNameAndInputThenRun(
        AvailableCommands.EXPERIMENT_BRANCH,
        'Name the new branch'
      )
    )
  )
}

const registerExperimentQuickPickCommands = (
  experiments: Experiments
): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.experimentGarbageCollect', () =>
      experiments.getCwdAndQuickPickThenRun(
        AvailableCommands.EXPERIMENT_GARBAGE_COLLECT,
        pickGarbageCollectionFlags
      )
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.addExperimentsTableFilter', () =>
      experiments.addFilter()
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.removeExperimentsTableFilters', () =>
      experiments.removeFilters()
    )
  )

  experiments.dispose.track(
    commands.registerCommand(
      'dvc.addExperimentsTableSort',
      (dvcRoot?: string) => experiments.pickAndAddSort(dvcRoot)
    )
  )

  experiments.dispose.track(
    commands.registerCommand(
      'dvc.removeExperimentsTableSorts',
      (dvcRoot?: string) => experiments.removeSorts(dvcRoot)
    )
  )
}

const registerExperimentRunCommands = (experiments: Experiments): void => {
  experiments.dispose.track(
    commands.registerCommand('dvc.runExperiment', () =>
      experiments.showExperimentsTableThenRun(AvailableCommands.EXPERIMENT_RUN)
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.runResetExperiment', () =>
      experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_RESET
      )
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.runQueuedExperiments', () =>
      experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_QUEUED
      )
    )
  )

  experiments.dispose.track(
    commands.registerCommand('dvc.showExperiments', () =>
      experiments.showExperimentsTable()
    )
  )
}

export const registerExperimentCommands = (experiments: Experiments) => {
  registerExperimentCwdCommands(experiments)
  registerExperimentNameCommands(experiments)
  registerExperimentInputCommands(experiments)
  registerExperimentQuickPickCommands(experiments)
  registerExperimentRunCommands(experiments)
}
