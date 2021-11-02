export enum RegisteredCliCommands {
  EXPERIMENT_APPLY = 'dvc.applyExperiment',
  EXPERIMENT_BRANCH = 'dvc.branchExperiment',
  EXPERIMENT_GARBAGE_COLLECT = 'dvc.experimentGarbageCollect',
  EXPERIMENT_REMOVE = 'dvc.removeExperiment',
  EXPERIMENT_RUN = 'dvc.runExperiment',
  EXPERIMENT_RUN_QUEUED = 'dvc.runQueuedExperiments',
  EXPERIMENT_RUN_RESET = 'dvc.runResetExperiment',
  QUEUE_EXPERIMENT = 'dvc.queueExperiment',

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
  REMOVE_TARGET = 'dvc.removeTarget',
  RENAME_TARGET = 'dvc.renameTarget'
}

export enum RegisteredCommands {
  EXPERIMENT_FILTER_ADD = 'dvc.addExperimentsTableFilter',
  EXPERIMENT_FILTER_REMOVE = 'dvc.views.experimentsFilterByTree.removeFilter',
  EXPERIMENT_FILTERS_REMOVE = 'dvc.removeExperimentsTableFilters',
  EXPERIMENT_FILTERS_REMOVE_ALL = 'dvc.views.experimentsFilterByTree.removeAllFilters',
  EXPERIMENT_PARAMS_AND_METRICS_TOGGLE = 'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
  EXPERIMENT_SHOW = 'dvc.showExperiments',
  EXPERIMENT_SORT_ADD = 'dvc.addExperimentsTableSort',
  EXPERIMENT_SORT_REMOVE = 'dvc.views.experimentsSortByTree.removeSort',
  EXPERIMENT_SORTS_REMOVE = 'dvc.removeExperimentsTableSorts',
  EXPERIMENT_SORTS_REMOVE_ALL = 'dvc.views.experimentsSortByTree.removeAllSorts',
  STOP_EXPERIMENT = 'dvc.stopRunningExperiment',

  PLOTS_SHOW = 'dvc.showPlots',

  EXTENSION_GET_STARTED = 'dvc.getStarted',
  EXTENSION_SETUP_WORKSPACE = 'dvc.setupWorkspace',
  EXTENSION_SHOW_COMMANDS = 'dvc.showCommands',
  EXTENSION_SHOW_OUTPUT = 'dvc.showOutput',

  DELETE_TARGET = 'dvc.deleteTarget',
  MOVE_TARGETS = 'dvc.moveTargets',

  RESET_WORKSPACE = 'dvc.resetWorkspace',

  TRACKED_EXPLORER_OPEN_FILE = 'dvc.views.trackedExplorerTree.openFile',
  TRACKED_EXPLORER_COMPARE_SELECTED = 'dvc.compareSelected',
  TRACKED_EXPLORER_COPY_FILE_PATH = 'dvc.copyFilePath',
  TRACKED_EXPLORER_COPY_REL_FILE_PATH = 'dvc.copyRelativeFilePath',
  TRACKED_EXPLORER_FIND_IN_FOLDER = 'dvc.findInFolder',
  TRACKED_EXPLORER_OPEN_TO_THE_SIDE = 'dvc.openToTheSide',
  TRACKED_EXPLORER_SELECT_FOR_COMPARE = 'dvc.selectForCompare',

  GIT_STAGE_ALL = 'dvc.gitStageAll',
  GIT_UNSTAGE_ALL = 'dvc.gitUnstageAll'
}
