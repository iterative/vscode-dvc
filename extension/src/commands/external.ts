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
  EXPERIMENT_REMOVE = 'dvc.removeExperiment',
  EXPERIMENT_RUN = 'dvc.runExperiment',
  EXPERIMENT_RUN_QUEUED = 'dvc.runQueuedExperiments',
  EXPERIMENT_RUN_RESET = 'dvc.runResetExperiment',
  EXPERIMENT_SHOW = 'dvc.showExperiments',
  EXPERIMENT_SORT_ADD = 'dvc.addExperimentsTableSort',
  EXPERIMENT_SORTS_REMOVE = 'dvc.removeExperimentsTableSorts',
  QUEUE_EXPERIMENT = 'dvc.queueExperiment',
  STOP_EXPERIMENT = 'dvc.stopRunningExperiment',

  EXTENSION_DESELECT_DEFAULT_PROJECT = 'dvc.deselectDefaultProject',
  EXTENSION_SELECT_DEFAULT_PROJECT = 'dvc.selectDefaultProject',
  EXTENSION_SETUP_WORKSPACE = 'dvc.setupWorkspace'
}

export const registerInstrumentedCommand = <T = string>(
  name: RegisteredCommands,
  func: (arg?: T) => unknown
): Disposable =>
  commands.registerCommand(name, async arg => {
    const stopWatch = new StopWatch()
    const res = await func(arg)
    sendTelemetryEvent(name, undefined, {
      duration: stopWatch.getElapsedTime()
    })
    return res
  })
