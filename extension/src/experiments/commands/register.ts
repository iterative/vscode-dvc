import { getBranchExperimentCommand, getPushExperimentCommand } from '.'
import { pickGarbageCollectionFlags } from '../quickPick'
import { WorkspaceExperiments } from '../workspace'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { Title } from '../../vscode/title'
import { Context, getDvcRootFromContext } from '../../vscode/context'
import { Setup } from '../../setup'
import { showSetupOrExecuteCommand } from '../../commands/util'

type ExperimentDetails = { dvcRoot: string; id: string }

const registerExperimentCwdCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.QUEUE_EXPERIMENT,
    () =>
      experiments.pauseUpdatesThenRun(() =>
        experiments.getCwdThenReport(AvailableCommands.EXP_QUEUE)
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.QUEUE_STOP,
    () => experiments.getCwdThenReport(AvailableCommands.QUEUE_STOP)
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
    () => experiments.getCwdThenReport(AvailableCommands.EXP_REMOVE_QUEUE)
  )
}

const registerExperimentNameCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_APPLY,
    () => experiments.getCwdAndExpNameThenRun(AvailableCommands.EXP_APPLY)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_APPLY,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.runCommand(AvailableCommands.EXP_APPLY, dvcRoot, id)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_REMOVE,
    ({ dvcRoot, ids }: { dvcRoot: string; ids: string[] }) =>
      experiments.runCommand(AvailableCommands.EXP_REMOVE, dvcRoot, ...ids)
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
        getBranchExperimentCommand(experiments),
        Title.ENTER_BRANCH_NAME
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getInputAndRun(
        getBranchExperimentCommand(experiments),
        Title.ENTER_BRANCH_NAME,
        dvcRoot,
        id
      )
  )
}

const registerExperimentQuickPickCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands,
  setup: Setup
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_GARBAGE_COLLECT,
    () =>
      experiments.getCwdAndQuickPickThenRun(
        AvailableCommands.EXP_GARBAGE_COLLECT,
        pickGarbageCollectionFlags
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_FILTER_ADD,
    (context: Context) => experiments.addFilter(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_FILTER_ADD_STARRED,
    (context: Context) =>
      experiments.addStarredFilter(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_FILTERS_REMOVE,
    () => experiments.removeFilters()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SORT_ADD,
    (context: Context) => experiments.addSort(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SORT_ADD_STARRED,
    (context: Context) =>
      experiments.addStarredSort(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SORTS_REMOVE,
    () => experiments.removeSorts()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SELECT,
    (context: Context) =>
      experiments.selectExperimentsToPlot(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_COLUMNS_SELECT,
    (context: Context) =>
      experiments.selectColumns(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.QUEUE_KILL,
    () => experiments.selectQueueTasksToKill()
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_PUSH,
    () => experiments.selectExperimentsToPush(setup)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_REMOVE,
    () => experiments.selectExperimentsToRemove()
  )
}

const registerExperimentRunCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands,
  setup: Setup
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RUN,
    showSetupOrExecuteCommand(setup, () =>
      experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN)
    )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RESUME,
    () => experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RUN)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_RESET_AND_RUN,
    showSetupOrExecuteCommand(setup, () =>
      experiments.getCwdThenRun(AvailableCommands.EXPERIMENT_RESET_AND_RUN)
    )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.QUEUE_START,
    () =>
      experiments.getCwdIntegerInputAndRun(
        AvailableCommands.QUEUE_START,
        Title.ENTER_EXPERIMENT_WORKER_COUNT,
        {
          prompt:
            'Input the maximum number of concurrent queue workers to start.',
          value: '1'
        }
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_SHOW,
    showSetupOrExecuteCommand(setup, context =>
      experiments.showWebview(getDvcRootFromContext(context))
    )
  )
}

export const registerExperimentCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands,
  setup: Setup
) => {
  registerExperimentCwdCommands(experiments, internalCommands)
  registerExperimentNameCommands(experiments, internalCommands)
  registerExperimentInputCommands(experiments, internalCommands)
  registerExperimentQuickPickCommands(experiments, internalCommands, setup)
  registerExperimentRunCommands(experiments, internalCommands, setup)

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_TOGGLE,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getRepository(dvcRoot).toggleExperimentStatus(id)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_PUSH,
    getPushExperimentCommand(internalCommands, setup)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_SHOW_LOGS,
    ({ dvcRoot, id }: ExperimentDetails) =>
      internalCommands.executeCommand(AvailableCommands.QUEUE_LOGS, dvcRoot, id)
  )
}
