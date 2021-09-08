import { commands } from 'vscode'
import { Disposable } from '../extension'
import { sendTelemetryEventAndThrow, sendTelemetryEvent } from '../telemetry'
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

  ADD_TARGET = 'dvc.addTarget',
  CHECKOUT = 'dvc.checkout',
  CHECKOUT_TARGET = 'dvc.checkoutTarget',
  COMMIT = 'dvc.commit',
  COMMIT_TARGET = 'dvc.commitTarget',
  INIT = 'dvc.init',
  PULL = 'dvc.pull',
  PULL_TARGET = 'dvc.pullTarget',
  PUSH = 'dvc.push',
  PUSH_TARGET = 'dvc.pushTarget',
  DELETE_TARGET = 'dvc.deleteTarget',
  REMOVE_TARGET = 'dvc.removeTarget',
  RENAME_TARGET = 'dvc.renameTarget',

  EXTENSION_DESELECT_DEFAULT_PROJECT = 'dvc.deselectDefaultProject',
  EXTENSION_SELECT_DEFAULT_PROJECT = 'dvc.selectDefaultProject',
  EXTENSION_SETUP_WORKSPACE = 'dvc.setupWorkspace',

  TRACKED_EXPLORER_OPEN_FILE = 'dvc.views.trackedExplorerTree.openFile',
  TRACKED_EXPLORER_COPY_FILE_PATH = 'dvc.copyFilePath',
  TRACKED_EXPLORER_COPY_REL_FILE_PATH = 'dvc.copyRelativeFilePath'
}

export const registerInstrumentedCommand = <T = string | undefined>(
  name: RegisteredCommands,
  func: (arg: T) => unknown
): Disposable =>
  commands.registerCommand(name, async arg => {
    const stopWatch = new StopWatch()
    try {
      const res = await func(arg)
      sendTelemetryEvent(name, undefined, {
        duration: stopWatch.getElapsedTime()
      })
      return res
    } catch (e: unknown) {
      sendTelemetryEventAndThrow(name, e as Error, stopWatch.getElapsedTime())
    }
  })
