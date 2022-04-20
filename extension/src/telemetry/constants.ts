import { ViewColumn } from 'vscode'
import { WorkspaceScale } from './collect'
import { RegisteredCliCommands, RegisteredCommands } from '../commands/external'
import { PlotSize, Section, SectionCollapsed } from '../plots/webview/contract'

export const APPLICATION_INSIGHTS_KEY = '46e8e554-d50a-471a-a53b-4af2b1cd6594'
export const EXTENSION_ID = 'iterative.dvc'

const ViewOpenedEvent = {
  VIEWS_EXPERIMENTS_FILTER_BY_TREE_OPENED:
    'views.experimentsFilterByTree.opened',
  VIEWS_EXPERIMENTS_METRICS_AND_PARAMS_TREE_OPENED:
    'views.experimentsMetricsAndParamsTree.opened',
  VIEWS_EXPERIMENTS_SORT_BY_TREE_OPENED: 'views.experimentsSortByTree.opened',
  VIEWS_EXPERIMENTS_TREE_OPENED: 'views.experimentsTree.opened',
  VIEWS_PLOTS_PATH_TREE_OPENED: 'views.plotsPathTree.opened',
  VIEWS_TRACKED_EXPLORER_TREE_OPENED: 'views.trackedExplorerTree.opened'
} as const

export type ViewOpenedEventName =
  typeof ViewOpenedEvent[keyof typeof ViewOpenedEvent]

export const EventName = Object.assign(
  {
    EXPERIMENTS_RUNNER_COMPLETED: 'experiments.runner.completed',

    EXTENSION_EXECUTION_DETAILS_CHANGED: 'extension.executionDetails.changed',
    EXTENSION_LOAD: 'extension.load',

    VIEWS_EXPERIMENTS_TABLE_CLOSED: 'views.experimentsTable.closed',
    VIEWS_EXPERIMENTS_TABLE_COLUMNS_REORDERED:
      'views.experimentsTable.columnsReordered',
    VIEWS_EXPERIMENTS_TABLE_COLUMN_RESIZED:
      'views.experimentsTable.columnResized',
    VIEWS_EXPERIMENTS_TABLE_CREATED: 'views.experimentsTable.created',
    VIEWS_EXPERIMENTS_TABLE_EXPERIMENT_TOGGLE:
      'views.experimentTable.toggleStatus',
    VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED:
      'views.experimentsTable.focusChanged',

    VIEWS_PLOTS_CLOSED: 'views.plots.closed',
    VIEWS_PLOTS_CREATED: 'views.plots.created',
    VIEWS_PLOTS_FOCUS_CHANGED: 'views.plots.focusChanged',
    VIEWS_PLOTS_METRICS_REORDERED: 'views.plots.metricsReordered',
    VIEWS_PLOTS_METRICS_SELECTED: 'views.plots.metricsSelected',
    VIEWS_PLOTS_REVISIONS_REORDERED: 'views.plots.revisionsReordered',
    VIEWS_PLOTS_SECTION_RENAMED: 'views.plots.sectionRenamed',
    VIEWS_PLOTS_SECTION_RESIZED: 'views.plots.sectionResized',
    VIEWS_PLOTS_SECTION_TOGGLE: 'views.plots.toggleSection',
    VIEWS_PLOTS_TEMPLATES_REORDERED: 'views.plots.templatesReordered',

    VIEWS_TERMINAL_CLOSED: 'views.terminal.closed',
    VIEWS_TERMINAL_CREATED: 'views.terminal.created',
    VIEWS_TERMINAL_FOCUS_CHANGED: 'views.terminal.focusChanged'
  } as const,
  ViewOpenedEvent,
  RegisteredCliCommands,
  RegisteredCommands
)

type DvcRootCount = { dvcRootCount: number }

type ExtensionProperties = {
  cliAccessible: boolean
  dvcPathUsed: boolean
  msPythonInstalled: boolean
  msPythonUsed: boolean
  pythonPathUsed: boolean
  templates?: number
  workspaceFolderCount: number
} & DvcRootCount &
  Partial<WorkspaceScale>

type WebviewFocusChangedProperties = {
  active: boolean
  viewColumn: ViewColumn | undefined
  visible: boolean
}

export interface IEventNamePropertyMapping {
  [EventName.EXTENSION_EXECUTION_DETAILS_CHANGED]: ExtensionProperties
  [EventName.EXTENSION_LOAD]: ExtensionProperties

  [EventName.EXPERIMENTS_RUNNER_COMPLETED]: {
    command: string
    exitCode: number | null
    wasStopped?: boolean
  }

  [EventName.EXPERIMENT_APPLY]: undefined
  [EventName.EXPERIMENT_AUTO_APPLY_FILTERS]: undefined
  [EventName.EXPERIMENT_DISABLE_AUTO_APPLY_FILTERS]: undefined
  [EventName.EXPERIMENT_BRANCH]: undefined
  [EventName.EXPERIMENT_FILTER_ADD]: undefined
  [EventName.EXPERIMENT_FILTER_REMOVE]: undefined
  [EventName.EXPERIMENT_FILTERS_REMOVE]: undefined
  [EventName.EXPERIMENT_FILTERS_REMOVE_ALL]: undefined
  [EventName.EXPERIMENT_GARBAGE_COLLECT]: undefined
  [EventName.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE]: undefined
  [EventName.EXPERIMENT_REMOVE]: undefined
  [EventName.EXPERIMENT_REMOVE_QUEUE]: undefined
  [EventName.EXPERIMENT_REMOVE_QUEUED]: undefined
  [EventName.EXPERIMENT_RUN]: undefined
  [EventName.EXPERIMENT_RUN_QUEUED]: undefined
  [EventName.EXPERIMENT_RUN_RESET]: undefined
  [EventName.EXPERIMENT_SELECT]: undefined
  [EventName.EXPERIMENT_SHOW]: undefined
  [EventName.EXPERIMENT_SORT_ADD]: undefined
  [EventName.EXPERIMENT_SORT_REMOVE]: undefined
  [EventName.EXPERIMENT_SORTS_REMOVE]: undefined
  [EventName.EXPERIMENT_SORTS_REMOVE_ALL]: undefined
  [EventName.EXPERIMENT_TREE_APPLY]: undefined
  [EventName.EXPERIMENT_TREE_BRANCH]: undefined
  [EventName.EXPERIMENT_TREE_QUEUE]: undefined
  [EventName.EXPERIMENT_TREE_REMOVE]: undefined
  [EventName.EXPERIMENT_TOGGLE]: undefined
  [EventName.QUEUE_EXPERIMENT]: undefined
  [EventName.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE]: undefined
  [EventName.STOP_EXPERIMENT]: { stopped: boolean; wasRunning: boolean }

  [EventName.PLOTS_PATH_TOGGLE]: undefined
  [EventName.PLOTS_SHOW]: undefined

  [EventName.ADD_TARGET]: undefined
  [EventName.CHECKOUT_TARGET]: undefined
  [EventName.CHECKOUT]: undefined
  [EventName.COMMIT_TARGET]: undefined
  [EventName.COMMIT]: undefined
  [EventName.DELETE_TARGET]: undefined
  [EventName.INIT]: undefined
  [EventName.MOVE_TARGETS]: undefined
  [EventName.PULL_TARGET]: undefined
  [EventName.PULL]: undefined
  [EventName.PUSH_TARGET]: undefined
  [EventName.PUSH]: undefined
  [EventName.REMOVE_TARGET]: undefined
  [EventName.RENAME_TARGET]: undefined
  [EventName.RESET_WORKSPACE]: undefined

  [EventName.GIT_STAGE_ALL]: undefined
  [EventName.GIT_UNSTAGE_ALL]: undefined

  [EventName.TRACKED_EXPLORER_COMPARE_SELECTED]: undefined
  [EventName.TRACKED_EXPLORER_COPY_FILE_PATH]: undefined
  [EventName.TRACKED_EXPLORER_COPY_REL_FILE_PATH]: undefined
  [EventName.TRACKED_EXPLORER_FIND_IN_FOLDER]: undefined
  [EventName.TRACKED_EXPLORER_OPEN_FILE]: undefined
  [EventName.TRACKED_EXPLORER_OPEN_TO_THE_SIDE]: undefined
  [EventName.TRACKED_EXPLORER_SELECT_FOR_COMPARE]: undefined

  [EventName.EXTENSION_CHECK_CLI_COMPATIBLE]: undefined
  [EventName.EXTENSION_GET_STARTED]: undefined
  [EventName.EXTENSION_SETUP_WORKSPACE]: { completed: boolean }
  [EventName.EXTENSION_SHOW_COMMANDS]: undefined
  [EventName.EXTENSION_SHOW_OUTPUT]: undefined

  [EventName.VIEWS_EXPERIMENTS_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_FILTER_BY_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_METRICS_AND_PARAMS_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_SORT_BY_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_TREE_OPENED]: DvcRootCount
  [EventName.VIEWS_EXPERIMENTS_TABLE_EXPERIMENT_TOGGLE]: undefined
  [EventName.VIEWS_EXPERIMENTS_TABLE_CLOSED]: undefined
  [EventName.VIEWS_EXPERIMENTS_TABLE_COLUMNS_REORDERED]: undefined
  [EventName.VIEWS_EXPERIMENTS_TABLE_COLUMN_RESIZED]: {
    width: number
  }
  [EventName.VIEWS_EXPERIMENTS_TABLE_CREATED]: undefined
  [EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED]: WebviewFocusChangedProperties

  [EventName.VIEWS_PLOTS_CLOSED]: undefined
  [EventName.VIEWS_PLOTS_CREATED]: undefined
  [EventName.VIEWS_PLOTS_FOCUS_CHANGED]: WebviewFocusChangedProperties
  [EventName.VIEWS_PLOTS_METRICS_REORDERED]: undefined
  [EventName.VIEWS_PLOTS_METRICS_SELECTED]: undefined
  [EventName.VIEWS_PLOTS_REVISIONS_REORDERED]: undefined
  [EventName.VIEWS_PLOTS_SECTION_RENAMED]: { section: Section }
  [EventName.VIEWS_PLOTS_SECTION_RESIZED]: { section: Section; size: PlotSize }
  [EventName.VIEWS_PLOTS_SECTION_TOGGLE]: Partial<SectionCollapsed>
  [EventName.VIEWS_PLOTS_TEMPLATES_REORDERED]: undefined

  [EventName.VIEWS_PLOTS_PATH_TREE_OPENED]: DvcRootCount

  [EventName.VIEWS_TERMINAL_CLOSED]: undefined
  [EventName.VIEWS_TERMINAL_FOCUS_CHANGED]: { active: boolean }
  [EventName.VIEWS_TERMINAL_CREATED]: undefined

  [EventName.VIEWS_TRACKED_EXPLORER_TREE_OPENED]: DvcRootCount
}
