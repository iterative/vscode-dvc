import {
  getBranchExperimentCommand,
  getPushExperimentCommand,
  getRenameExperimentCommand
} from '.'
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
    () => experiments.getCwdThenReport(AvailableCommands.EXP_QUEUE)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.QUEUE_STOP,
    () => experiments.getCwdThenReport(AvailableCommands.QUEUE_STOP)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_WORKSPACE_PARAMS_AND_QUEUE,
    () => experiments.modifyWorkspaceParamsAndQueue()
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_QUEUE,
    ({ dvcRoot }: ExperimentDetails) =>
      experiments.modifyWorkspaceParamsAndQueue(dvcRoot)
  )

  const modifyWorkspaceParamsAndRun = () =>
    experiments.modifyWorkspaceParamsAndRun(AvailableCommands.EXPERIMENT_RUN)

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_WORKSPACE_PARAMS_AND_RESUME,
    modifyWorkspaceParamsAndRun
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_WORKSPACE_PARAMS_AND_RUN,
    modifyWorkspaceParamsAndRun
  )

  const modifyWorkspaceParamsAndRunFromView = ({
    dvcRoot
  }: ExperimentDetails) =>
    experiments.modifyWorkspaceParamsAndRun(
      AvailableCommands.EXPERIMENT_RUN,
      dvcRoot
    )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_RESUME,
    modifyWorkspaceParamsAndRunFromView
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_RUN,
    modifyWorkspaceParamsAndRunFromView
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.MODIFY_WORKSPACE_PARAMS_RESET_AND_RUN,
    () =>
      experiments.modifyWorkspaceParamsAndRun(
        AvailableCommands.EXPERIMENT_RESET_AND_RUN
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_RESET_AND_RUN,
    ({ dvcRoot }: ExperimentDetails) =>
      experiments.modifyWorkspaceParamsAndRun(
        AvailableCommands.EXPERIMENT_RESET_AND_RUN,
        dvcRoot
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

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_VIEW_STOP,
    ({ dvcRoot, ids }: { dvcRoot: string; ids: string[] }) =>
      experiments.stopExperiments(dvcRoot, ...ids)
  )
}

const registerExperimentInputCommands = (
  experiments: WorkspaceExperiments,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_BRANCH,
    () => experiments.createExperimentBranch()
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_RENAME,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getInputAndRun(
        getRenameExperimentCommand(experiments),
        Title.ENTER_NEW_EXPERIMENT_NAME,
        id,
        dvcRoot,
        id
      )
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_BRANCH,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getInputAndRun(
        getBranchExperimentCommand(experiments),
        Title.ENTER_BRANCH_NAME,
        `${id}-branch`,
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

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_COLUMNS_SELECT_FIRST,
    (context: Context) =>
      experiments.selectFirstColumns(getDvcRootFromContext(context))
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_STOP,
    () => experiments.selectExperimentsToStop()
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
    RegisteredCommands.EXPERIMENTS_REFRESH,
    ({ dvcRoot }: { dvcRoot: string }) =>
      experiments.getRepository(dvcRoot).refresh()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXPERIMENT_TOGGLE,
    ({ dvcRoot, id }: ExperimentDetails) =>
      experiments.getRepository(dvcRoot).toggleExperimentStatus(id)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_PUSH,
    getPushExperimentCommand(experiments, internalCommands, setup)
  )

  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.EXPERIMENT_VIEW_SHOW_LOGS,
    ({ dvcRoot, id }: ExperimentDetails) =>
      internalCommands.executeCommand(AvailableCommands.QUEUE_LOGS, dvcRoot, id)
  )
}
