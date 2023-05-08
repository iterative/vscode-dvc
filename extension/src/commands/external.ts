export enum RegisteredCliCommands {
  EXPERIMENT_APPLY = 'dvc.applyExperiment',
  EXPERIMENT_BRANCH = 'dvc.branchExperiment',
  EXPERIMENT_GARBAGE_COLLECT = 'dvc.experimentGarbageCollect',
  EXPERIMENT_PUSH = 'dvc.pushExperiments',
  EXPERIMENT_REMOVE = 'dvc.removeExperiments',
  EXPERIMENT_REMOVE_QUEUE = 'dvc.removeExperimentQueue',
  EXPERIMENT_RESET_AND_RUN = 'dvc.resetAndRunCheckpointExperiment',
  EXPERIMENT_RESUME = 'dvc.resumeCheckpointExperiment',
  EXPERIMENT_RUN = 'dvc.runExperiment',
  QUEUE_EXPERIMENT = 'dvc.queueExperiment',
  QUEUE_START = 'dvc.startExperimentsQueue',
  QUEUE_STOP = 'dvc.stopExperimentsQueue',

  EXPERIMENT_VIEW_APPLY = 'dvc.views.experiments.applyExperiment',
  EXPERIMENT_VIEW_BRANCH = 'dvc.views.experiments.branchExperiment',
  EXPERIMENT_VIEW_PUSH = 'dvc.views.experiments.pushExperiment',
  EXPERIMENT_VIEW_REMOVE = 'dvc.views.experiments.removeExperiment',
  EXPERIMENT_VIEW_SHOW_LOGS = 'dvc.views.experiments.showLogs',
  EXPERIMENT_VIEW_STOP = 'dvc.views.experiments.stopQueueExperiment',

  EXPERIMENT_VIEW_QUEUE = 'dvc.views.experiments.queueExperiment',
  EXPERIMENT_VIEW_RESUME = 'dvc.views.experiments.resumeCheckpointExperiment',
  EXPERIMENT_VIEW_RUN = 'dvc.views.experiments.runExperiment',
  EXPERIMENT_VIEW_RESET_AND_RUN = 'dvc.views.experiments.resetAndRunCheckpointExperiment',

  MODIFY_EXPERIMENT_PARAMS_AND_QUEUE = 'dvc.modifyExperimentParamsAndQueue',
  MODIFY_EXPERIMENT_PARAMS_AND_RESUME = 'dvc.modifyExperimentParamsAndResume',
  MODIFY_EXPERIMENT_PARAMS_AND_RUN = 'dvc.modifyExperimentParamsAndRun',
  MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN = 'dvc.modifyExperimentParamsResetAndRun',

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
  RENAME_TARGET = 'dvc.renameTarget',

  GIT_STAGE_ALL = 'dvc.gitStageAll',
  GIT_UNSTAGE_ALL = 'dvc.gitUnstageAll'
}

export enum RegisteredCommands {
  EXPERIMENT_COLUMNS_SELECT = 'dvc.views.experimentsColumnsTree.selectColumns',
  EXPERIMENT_FILTER_ADD = 'dvc.addExperimentsTableFilter',
  EXPERIMENT_FILTER_ADD_STARRED = 'dvc.addStarredExperimentsTableFilter',
  EXPERIMENT_FILTER_REMOVE = 'dvc.views.experimentsFilterByTree.removeFilter',
  EXPERIMENT_FILTERS_REMOVE = 'dvc.removeExperimentsTableFilters',
  EXPERIMENT_FILTERS_REMOVE_ALL = 'dvc.views.experimentsFilterByTree.removeAllFilters',
  EXPERIMENT_METRICS_AND_PARAMS_TOGGLE = 'dvc.views.experimentsColumnsTree.toggleStatus',
  EXPERIMENT_SELECT = 'dvc.views.experimentsTree.selectExperiments',
  EXPERIMENT_SHOW = 'dvc.showExperiments',
  EXPERIMENT_SORT_ADD = 'dvc.addExperimentsTableSort',
  EXPERIMENT_SORT_ADD_STARRED = 'dvc.addStarredExperimentsTableSort',
  EXPERIMENT_SORT_REMOVE = 'dvc.views.experimentsSortByTree.removeSort',
  EXPERIMENT_SORTS_REMOVE = 'dvc.removeExperimentsTableSorts',
  EXPERIMENT_SORTS_REMOVE_ALL = 'dvc.views.experimentsSortByTree.removeAllSorts',
  EXPERIMENT_STOP = 'dvc.stopExperiments',
  EXPERIMENT_TOGGLE = 'dvc.views.experiments.toggleStatus',
  STOP_EXPERIMENTS = 'dvc.stopAllRunningExperiments',

  PLOTS_PATH_TOGGLE = 'dvc.views.plotsPathsTree.toggleStatus',
  PLOTS_SHOW = 'dvc.showPlots',
  PLOTS_SELECT = 'dvc.views.plotsPathsTree.selectPlots',
  PLOTS_REFRESH = 'dvc.views.plotsPathsTree.refreshPlots',
  PLOTS_CUSTOM_ADD = 'dvc.views.plots.addCustomPlot',
  PLOTS_CUSTOM_REMOVE = 'dvc.views.plots.removeCustomPlots',

  EXPERIMENT_AND_PLOTS_SHOW = 'dvc.showExperimentsAndPlots',

  EXTENSION_CHECK_CLI_COMPATIBLE = 'dvc.checkCLICompatible',
  EXTENSION_GET_STARTED = 'dvc.getStarted',
  EXTENSION_SETUP_WORKSPACE = 'dvc.setupWorkspace',
  EXTENSION_SHOW_COMMANDS = 'dvc.showCommands',
  EXTENSION_SHOW_OUTPUT = 'dvc.showOutput',

  DELETE_TARGET = 'dvc.deleteTarget',
  MOVE_TARGETS = 'dvc.moveTargets',

  DISCARD_WORKSPACE_CHANGES = 'dvc.discardWorkspaceChanges',

  TRACKED_EXPLORER_OPEN_FILE = 'dvc.views.trackedExplorerTree.openFile',
  TRACKED_EXPLORER_COMPARE_SELECTED = 'dvc.compareSelected',
  TRACKED_EXPLORER_COPY_FILE_PATH = 'dvc.copyFilePath',
  TRACKED_EXPLORER_COPY_REL_FILE_PATH = 'dvc.copyRelativeFilePath',
  TRACKED_EXPLORER_FIND_IN_FOLDER = 'dvc.findInFolder',
  TRACKED_EXPLORER_OPEN_TO_THE_SIDE = 'dvc.openToTheSide',
  TRACKED_EXPLORER_SELECT_FOR_COMPARE = 'dvc.selectForCompare',

  SETUP_SHOW = 'dvc.showSetup',
  SETUP_SHOW_EXPERIMENTS = 'dvc.showExperimentsSetup',
  SETUP_SHOW_DVC = 'dvc.showDvcSetup',
  SELECT_FOCUSED_PROJECTS = 'dvc.selectFocusedProjects',

  ADD_STUDIO_ACCESS_TOKEN = 'dvc.addStudioAccessToken',
  UPDATE_STUDIO_ACCESS_TOKEN = 'dvc.updateStudioAccessToken',
  REMOVE_STUDIO_ACCESS_TOKEN = 'dvc.removeStudioAccessToken',
  SETUP_SHOW_STUDIO_CONNECT = 'dvc.showStudioConnect',
  SETUP_SHOW_STUDIO_SETTINGS = 'dvc.showStudioSettings',

  RESET_STATE = 'dvc.resetState'
}
