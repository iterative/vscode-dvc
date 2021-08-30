import { commands } from 'vscode'
import { Disposable } from '../extension'
import { sendTelemetryEvent } from '../telemetry'
import { StopWatch } from '../util/time'

export enum RegisteredCommands {
  EXPERIMENT_APPLY = 'dvc.applyExperiment',
  EXPERIMENT_BRANCH = 'dvc.branchExperiment',
  EXPERIMENT_FILTER_ADD = 'dvc.addExperimentsTableFilter',
  EXPERIMENT_FILTER_REMOVE = 'dvc.views.experimentsFilterByTree.removeFilter',
  EXPERIMENT_FILTERS_REMOVE = 'dvc.removeExperimentsTableFilters',
  EXPERIMENT_FILTERS_REMOVE_ALL = 'dvc.views.experimentsFilterByTree.removeAllFilters',
  EXPERIMENT_GARBAGE_COLLECT = 'dvc.experimentGarbageCollect',
  EXPERIMENT_PARAMS_AND_METRICS_TOGGLE = 'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
  EXPERIMENT_REMOVE = 'dvc.removeExperiment',
  EXPERIMENT_RUN = 'dvc.runExperiment',
  EXPERIMENT_RUN_QUEUED = 'dvc.runQueuedExperiments',
  EXPERIMENT_RUN_RESET = 'dvc.runResetExperiment',
  EXPERIMENT_SHOW = 'dvc.showExperiments',
  EXPERIMENT_SORT_ADD = 'dvc.addExperimentsTableSort',
  EXPERIMENT_SORT_REMOVE = 'dvc.views.experimentsSortByTree.removeSort',
  EXPERIMENT_SORTS_REMOVE = 'dvc.removeExperimentsTableSorts',
  EXPERIMENT_SORTS_REMOVE_ALL = 'dvc.views.experimentsSortByTree.removeAllSorts',
  QUEUE_EXPERIMENT = 'dvc.queueExperiment',
  STOP_EXPERIMENT = 'dvc.stopRunningExperiment',

  REPOSITORY_ADD_TARGET = 'dvc.addTarget',
  REPOSITORY_CHECKOUT = 'dvc.checkout',
  REPOSITORY_CHECKOUT_TARGET = 'dvc.checkoutTarget',
  REPOSITORY_COMMIT = 'dvc.commit',
  REPOSITORY_COMMIT_TARGET = 'dvc.commitTarget',
  REPOSITORY_PULL = 'dvc.pull',
  REPOSITORY_PUSH = 'dvc.push',

  EXTENSION_DESELECT_DEFAULT_PROJECT = 'dvc.deselectDefaultProject',
  EXTENSION_SELECT_DEFAULT_PROJECT = 'dvc.selectDefaultProject',
  EXTENSION_SETUP_WORKSPACE = 'dvc.setupWorkspace'
}

export const registerInstrumentedCommand = <T = string | undefined>(
  name: RegisteredCommands,
  func: (arg: T) => unknown
): Disposable =>
  commands.registerCommand(name, async arg => {
    const stopWatch = new StopWatch()
    const res = await func(arg)
    sendTelemetryEvent(name, undefined, {
      duration: stopWatch.getElapsedTime()
    })
    return res
  })
