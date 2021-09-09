import { pickGarbageCollectionFlags } from '../quickPick'
import { Experiments } from '..'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { RegisteredCommands } from '../../commands/external'

const registerExperimentCwdCommands = (
  internalCommands: InternalCommands,
  experiments: Experiments
): void =>
  internalCommands.registerExternalCommand(
    RegisteredCommands.QUEUE_EXPERIMENT,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_QUEUE)
  )

const registerExperimentNameCommands = (
  internalCommands: InternalCommands,
  experiments: Experiments
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_APPLY,
    () => experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_APPLY)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_REMOVE,
    () => experiments.getExpNameThenRun(AvailableCommands.EXPERIMENT_REMOVE)
  )
}

const registerExperimentInputCommands = (
  internalCommands: InternalCommands,
  experiments: Experiments
): void =>
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_BRANCH,
    () =>
      experiments.getExpNameAndInputThenRun(
        AvailableCommands.EXPERIMENT_BRANCH,
        'Name the new branch'
      )
  )

const registerExperimentQuickPickCommands = (
  internalCommands: InternalCommands,
  experiments: Experiments
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_GARBAGE_COLLECT,
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
  internalCommands: InternalCommands,
  experiments: Experiments
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_RUN,
    () =>
      experiments.showExperimentsTableThenRun(AvailableCommands.EXPERIMENT_RUN)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_RUN_RESET,
    () =>
      experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_RESET
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_RUN_QUEUED,
    () =>
      experiments.showExperimentsTableThenRun(
        AvailableCommands.EXPERIMENT_RUN_QUEUED
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SHOW,
    () => experiments.showExperimentsTable()
  )
}

export const registerExperimentCommands = (
  internalCommands: InternalCommands,
  experiments: Experiments
) => {
  registerExperimentCwdCommands(internalCommands, experiments)
  registerExperimentNameCommands(internalCommands, experiments)
  registerExperimentInputCommands(internalCommands, experiments)
  registerExperimentQuickPickCommands(internalCommands, experiments)
  registerExperimentRunCommands(internalCommands, experiments)
}
