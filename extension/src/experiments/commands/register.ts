import { pickGarbageCollectionFlags } from '../quickPick'
import { WorkspaceExperiments } from '../workspace'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'

const registerExperimentCwdCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.QUEUE_EXPERIMENT,
    () =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.getCwdThenReport(AvailableCommands.EXPERIMENT_QUEUE)
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.QUEUE_EXPERIMENTS_FROM_CSV,
    () =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.queueExperimentsFromCsv()
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.QUEUE_EXPERIMENT_FROM_EXISTING,
    () =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.queueExperimentFromExisting()
      )
  )
}

const registerExperimentNameCommands = (
  experiments: WorkspaceExperiments,
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
  experiments: WorkspaceExperiments,
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
  experiments: WorkspaceExperiments,
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

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SELECT,
    (dvcRoot?: string) => experiments.selectExperiments(dvcRoot)
  )
}

const registerExperimentRunCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RUN,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RUN_RESET,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN_RESET)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RUN_QUEUED,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN_QUEUED)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SHOW,
    () => experiments.showWebview()
  )
}

export const registerExperimentCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
) => {
  registerExperimentCwdCommands(experiments, internalCommands)
  registerExperimentNameCommands(experiments, internalCommands)
  registerExperimentInputCommands(experiments, internalCommands)
  registerExperimentQuickPickCommands(experiments, internalCommands)
  registerExperimentRunCommands(experiments, internalCommands)

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_AUTO_APPLY_FILTERS,
    (dvcRoot?: string) => experiments.autoApplyFilters(true, dvcRoot)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_DISABLE_AUTO_APPLY_FILTERS,
    (dvcRoot?: string) => experiments.autoApplyFilters(false, dvcRoot)
  )
}
