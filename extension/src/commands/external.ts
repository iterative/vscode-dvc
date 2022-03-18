export enum RegisteredCliCommands {
  EXPERIMENT_APPLY = 'dvc.applyExperiment',
  EXPERIMENT_BRANCH = 'dvc.branchExperiment',
  EXPERIMENT_GARBAGE_COLLECT = 'dvc.experimentGarbageCollect',
  EXPERIMENT_REMOVE = 'dvc.removeExperiment',
  EXPERIMENT_REMOVE_QUEUE = 'dvc.removeExperimentQueue',
  EXPERIMENT_REMOVE_QUEUED = 'dvc.removeQueuedExperiment',
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
  EXPERIMENT_AUTO_APPLY_FILTERS = 'dvc.views.experimentsTree.autoApplyFilters',
  EXPERIMENT_DISABLE_AUTO_APPLY_FILTERS = 'dvc.views.experimentsTree.disableAutoApplyFilters',
  EXPERIMENT_FILTER_ADD = 'dvc.addExperimentsTableFilter',
  EXPERIMENT_FILTER_REMOVE = 'dvc.views.experimentsFilterByTree.removeFilter',
  EXPERIMENT_FILTERS_REMOVE = 'dvc.removeExperimentsTableFilters',
  EXPERIMENT_FILTERS_REMOVE_ALL = 'dvc.views.experimentsFilterByTree.removeAllFilters',
  EXPERIMENT_METRICS_AND_PARAMS_TOGGLE = 'dvc.views.experimentsMetricsAndParamsTree.toggleStatus',
  EXPERIMENT_TREE_APPLY = 'dvc.views.experimentsTree.applyExperiment',
  EXPERIMENT_TREE_BRANCH = 'dvc.views.experimentsTree.branchExperiment',
  EXPERIMENT_TREE_REMOVE = 'dvc.views.experimentsTree.removeExperiment',
  EXPERIMENT_SELECT = 'dvc.views.experimentsTree.selectExperiments',
  EXPERIMENT_SHOW = 'dvc.showExperiments',
  EXPERIMENT_SORT_ADD = 'dvc.addExperimentsTableSort',
  EXPERIMENT_SORT_REMOVE = 'dvc.views.experimentsSortByTree.removeSort',
  EXPERIMENT_SORTS_REMOVE = 'dvc.removeExperimentsTableSorts',
  EXPERIMENT_SORTS_REMOVE_ALL = 'dvc.views.experimentsSortByTree.removeAllSorts',
  EXPERIMENT_TOGGLE = 'dvc.views.experimentsTree.toggleStatus',
  QUEUE_EXPERIMENT_FROM_EXISTING = 'dvc.queueExperimentFromExisting',
  STOP_EXPERIMENT = 'dvc.stopRunningExperiment',

  PLOTS_PATH_TOGGLE = 'dvc.views.plotsPathsTree.toggleStatus',
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
