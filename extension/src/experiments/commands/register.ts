import { pickGarbageCollectionFlags } from '../quickPick'
import { WorkspaceExperiments } from '../workspace'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { Title } from '../../vscode/title'
import { Args } from '../../cli/constants'

type ExperimentDetails = { dvcRoot: string; id: string }

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

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE,
    () =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.modifyExperimentParamsAndQueue()
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_QUEUE,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.modifyExperimentParamsAndQueue(dvcRoot, id)
      )
  )

  const modifyExperimentParamsAndRun = () =>
    experiments.pauseUpdatesThenRun(() =>
      experiments.modifyExperimentParamsAndRun(AvailableCommands.EXPERIMENT_RUN)
    )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_EXPERIMENT_PARAMS_AND_RESUME,
    modifyExperimentParamsAndRun
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_EXPERIMENT_PARAMS_AND_RUN,
    modifyExperimentParamsAndRun
  )

  const modifyExperimentParamsAndRunFromView = ({
    dvcRoot,
    id
  }: ExperimentDetails) =>
    experiments.pauseUpdatesThenRun(() =>
      experiments.modifyExperimentParamsAndRun(
        AvailableCommands.EXPERIMENT_RUN,
        dvcRoot,
        id
      )
    )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_RESUME,
    modifyExperimentParamsAndRunFromView
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_RUN,
    modifyExperimentParamsAndRunFromView
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN,
    () =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.modifyExperimentParamsAndRun(
          AvailableCommands.EXPERIMENT_RESET_AND_RUN
        )
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_RESET_AND_RUN,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.modifyExperimentParamsAndRun(
          AvailableCommands.EXPERIMENT_RESET_AND_RUN,
          dvcRoot,
          id
        )
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_REMOVE_QUEUE,
    () =>
      experiments.getCwdThenReport(AvailableCommands.EXPERIMENT_REMOVE_QUEUE)
  )
}

const registerExperimentNameCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_APPLY,
    () =>
      experiments.getCwdAndExpNameThenRun(AvailableCommands.EXPERIMENT_APPLY)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_APPLY,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getExpNameThenRun(
        AvailableCommands.EXPERIMENT_APPLY,
        dvcRoot,
        id
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_REMOVE,
    () =>
      experiments.getCwdAndExpNameThenRun(AvailableCommands.EXPERIMENT_REMOVE)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_REMOVE,
    ({ dvcRoot, ids }: { dvcRoot: string; ids: string[] }) =>
      experiments.runCommand(
        AvailableCommands.EXPERIMENT_REMOVE,
        dvcRoot,
        ...ids
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_REMOVE_QUEUED,
    () => experiments.getQueuedExpThenRun(AvailableCommands.EXPERIMENT_REMOVE)
  )
}

const registerExperimentInputCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_BRANCH,
    () =>
      experiments.getCwdExpNameAndInputThenRun(
        Title.ENTER_BRANCH_NAME,
        (cwd, ...args: Args) =>
          experiments.runCommand(
            AvailableCommands.EXPERIMENT_BRANCH,
            cwd,
            ...args
          )
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getExpNameAndInputThenRun(
        Title.ENTER_BRANCH_NAME,
        dvcRoot,
        id,
        (...args: Args) =>
          experiments.runCommand(
            AvailableCommands.EXPERIMENT_BRANCH,
            dvcRoot,
            ...args
          )
      )
  )
}

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
    RegisteredCommands.EXPERIMENT_FILTER_ADD_STARRED,
    (dvcRoot?: string) => experiments.addStarredFilter(dvcRoot)
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
    RegisteredCommands.EXPERIMENT_SORT_ADD_STARRED,
    (dvcRoot?: string) => experiments.addStarredSort(dvcRoot)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SORTS_REMOVE,
    () => experiments.removeSorts()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SELECT,
    (dvcRoot?: string) => experiments.selectExperiments(dvcRoot)
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_COLUMNS_SELECT,
    (dvcRoot?: string) => experiments.selectColumns(dvcRoot)
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
    RegisteredCliCommands.EXPERIMENT_RESUME,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RESET_AND_RUN,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RESET_AND_RUN)
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

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_TOGGLE,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getRepository(dvcRoot).toggleExperimentStatus(id)
  )
}
