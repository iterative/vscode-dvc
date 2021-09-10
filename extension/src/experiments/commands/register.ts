import { pickGarbageCollectionFlags } from '../quickPick'
import { Experiments } from '..'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'

const registerExperimentCwdCommands = (
  experiments: Experiments,
  internalCommands: InternalCommands
): void =>
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.QUEUE_EXPERIMENT,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_QUEUE)
  )

const registerExperimentNameCommands = (
  experiments: Experiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_APPLY,
    () => experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_APPLY)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_REMOVE,
    () => experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_REMOVE)
  )
}

const registerExperimentInputCommands = (
  experiments: Experiments,
  internalCommands: InternalCommands
): void =>
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_BRANCH,
    () =>
      experiments.getExpNameAndInputThenRun(
        AvailableCommands.EXPERIMENT_BRANCH,
        'Name the new branch'
      )
  )

const registerExperimentQuickPickCommands = (
  experiments: Experiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_GARBAGE_COLLECT,
    () =>
      experiments.getCwdAndQuickPickThenRun(
        AvailableCommands.EXPERIMENT_GARBAGE_COLLECT,
        pickGarbageCollectionFlags
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_FILTER_ADD,
    (dvcRoot?: string) => experiments.addFilter(dvcRoot)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_FILTERS_REMOVE,
    () => experiments.removeFilters()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SORT_ADD,
    (dvcRoot?: string) => experiments.addSort(dvcRoot)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SORTS_REMOVE,
    () => experiments.removeSorts()
  )
}

const registerExperimentRunCommands = (
  experiments: Experiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RUN,
    () =>
      experiments.showExperimentsTableThenRun(AvailableCommands.EXPERIMENT_RUN)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RUN_RESET,
    () =>
      experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_RESET
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RUN_QUEUED,
    () =>
      experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_QUEUED
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SHOW,
    () => experiments.showExperimentsTable()
  )

  internalCommands.registerExternalCommand(RegisteredCommands.PLOTS_SHOW, () =>
    experiments.showPlots()
  )
}

export const registerExperimentCommands = (
  experiments: Experiments,
  internalCommands: InternalCommands
) => {
  registerExperimentCwdCommands(experiments, internalCommands)
  registerExperimentNameCommands(experiments, internalCommands)
  registerExperimentInputCommands(experiments, internalCommands)
  registerExperimentQuickPickCommands(experiments, internalCommands)
  registerExperimentRunCommands(experiments, internalCommands)
}
