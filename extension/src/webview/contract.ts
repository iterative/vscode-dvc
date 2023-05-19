import { SortDefinition } from '../experiments/model/sortBy'
import { TableData } from '../experiments/webview/contract'
import {
  PlotHeight,
  PlotsData,
  PlotsSection,
  SectionCollapsed,
  TemplatePlotGroup
} from '../plots/webview/contract'
import { SetupData } from '../setup/webview/contract'

export type WebviewData = TableData | PlotsData | SetupData

export enum MessageFromWebviewType {
  INITIALIZED = 'initialized',
  ADD_CONFIGURATION = 'add-configuration',
  APPLY_EXPERIMENT_TO_WORKSPACE = 'apply-experiment-to-workspace',
  ADD_STARRED_EXPERIMENT_FILTER = 'add-starred-experiment-filter',
  ADD_CUSTOM_PLOT = 'add-custom-plot',
  CREATE_BRANCH_FROM_EXPERIMENT = 'create-branch-from-experiment',
  FOCUS_FILTERS_TREE = 'focus-filters-tree',
  FOCUS_SORTS_TREE = 'focus-sorts-tree',
  OPEN_EXPERIMENTS_WEBVIEW = 'open-experiments-webview',
  OPEN_PARAMS_FILE_TO_THE_SIDE = 'open-params-file-to-the-side',
  OPEN_PLOTS_WEBVIEW = 'open-plots-webview',
  OPEN_STUDIO = 'open-studio',
  OPEN_STUDIO_PROFILE = 'open-studio-profile',
  PUSH_EXPERIMENT = 'push-experiment',
  REMOVE_COLUMN_SORT = 'remove-column-sort',
  REMOVE_EXPERIMENT = 'remove-experiment',
  REORDER_COLUMNS = 'reorder-columns',
  REORDER_PLOTS_COMPARISON = 'reorder-plots-comparison',
  REORDER_PLOTS_COMPARISON_ROWS = 'reorder-plots-comparison-rows',
  REORDER_PLOTS_CUSTOM = 'reorder-plots-custom',
  REORDER_PLOTS_TEMPLATES = 'reorder-plots-templates',
  REFRESH_REVISIONS = 'refresh-revisions',
  RESIZE_COLUMN = 'resize-column',
  RESIZE_PLOTS = 'resize-plots',
  SAVE_STUDIO_TOKEN = 'save-studio-token',
  SHOW_EXPERIMENT_LOGS = 'show-experiment-logs',
  STOP_EXPERIMENTS = 'stop-experiments',
  SORT_COLUMN = 'sort-column',
  TOGGLE_EXPERIMENT = 'toggle-experiment',
  TOGGLE_EXPERIMENT_STAR = 'toggle-experiment-star',
  HIDE_EXPERIMENTS_TABLE_COLUMN = 'hide-experiments-table-column',
  SELECT_EXPERIMENTS = 'select-experiments',
  SELECT_COLUMNS = 'select-columns',
  SELECT_PLOTS = 'select-plots',
  SELECT_PYTHON_INTERPRETER = 'select-python-interpreter',
  SET_EXPERIMENTS_FOR_PLOTS = 'set-experiments-for-plots',
  SET_EXPERIMENTS_AND_OPEN_PLOTS = 'set-experiments-and-open-plots',
  SET_STUDIO_SHARE_EXPERIMENTS_LIVE = 'set-studio-share-experiments-live',
  TOGGLE_PLOTS_SECTION = 'toggle-plots-section',
  REMOTE_ADD = 'remote-add',
  REMOVE_CUSTOM_PLOTS = 'remove-custom-plots',
  REMOVE_STUDIO_TOKEN = 'remove-studio-token',
  MODIFY_EXPERIMENT_PARAMS_AND_QUEUE = 'modify-experiment-params-and-queue',
  MODIFY_EXPERIMENT_PARAMS_AND_RUN = 'modify-experiment-params-and-run',
  MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN = 'modify-experiment-params-reset-and-run',
  SET_EXPERIMENTS_HEADER_HEIGHT = 'update-experiments-header-height',
  CHECK_CLI_COMPATIBLE = 'check-cli-compatible',
  INITIALIZE_DVC = 'initialize-dvc',
  INITIALIZE_GIT = 'initialize-git',
  SHOW_SCM_PANEL = 'show-scm-panel',
  INSTALL_DVC = 'install-dvc',
  UPGRADE_DVC = 'upgrade-dvc',
  SETUP_WORKSPACE = 'setup-workspace',
  ZOOM_PLOT = 'zoom-plot',
  SHOW_MORE_COMMITS = 'show-more-commits',
  SHOW_LESS_COMMITS = 'show-less-commits',
  SWITCH_BRANCHES_VIEW = 'show-all-branches',
  SWITCH_COMMITS_VIEW = 'show-commits',
  SELECT_BRANCHES = 'select-branches'
}

export type ColumnResizePayload = {
  id: string
  width: number
}

export type PlotsResizedPayload = {
  section: PlotsSection
  nbItemsPerRow: number
  height: PlotHeight
}

export type PlotsTemplatesReordered = {
  group: TemplatePlotGroup
  paths: string[]
}[]

export type MessageFromWebview =
  | {
      type: MessageFromWebviewType.ADD_CUSTOM_PLOT
    }
  | {
      type: MessageFromWebviewType.REORDER_COLUMNS
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.RESIZE_COLUMN
      payload: ColumnResizePayload
    }
  | {
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT
      payload: string
    }
  | {
      type: MessageFromWebviewType.TOGGLE_EXPERIMENT_STAR
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN
      payload: string
    }
  | {
      type: MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE
      payload: string
    }
  | {
      type: MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE
      payload: string
    }
  | {
      type: MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER
    }
  | {
      type: MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT
      payload: string
    }
  | {
      type: MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_QUEUE
      payload: string
    }
  | {
      type: MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_AND_RUN
      payload: string
    }
  | {
      type: MessageFromWebviewType.MODIFY_EXPERIMENT_PARAMS_RESET_AND_RUN
      payload: string
    }
  | {
      type: MessageFromWebviewType.REMOVE_EXPERIMENT
      payload: string | string[]
    }
  | {
      type: MessageFromWebviewType.SORT_COLUMN
      payload: SortDefinition
    }
  | {
      type: MessageFromWebviewType.STOP_EXPERIMENTS
      payload: string[]
    }
  | { type: MessageFromWebviewType.SHOW_EXPERIMENT_LOGS; payload: string }
  | {
      type: MessageFromWebviewType.PUSH_EXPERIMENT
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.REMOVE_COLUMN_SORT
      payload: string
    }
  | { type: MessageFromWebviewType.REMOTE_ADD }
  | {
      type: MessageFromWebviewType.REMOVE_CUSTOM_PLOTS
    }
  | { type: MessageFromWebviewType.REMOVE_STUDIO_TOKEN }
  | {
      type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.REORDER_PLOTS_COMPARISON_ROWS
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.REORDER_PLOTS_CUSTOM
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.RESIZE_PLOTS
      payload: PlotsResizedPayload
    }
  | {
      type: MessageFromWebviewType.TOGGLE_PLOTS_SECTION
      payload: Partial<SectionCollapsed>
    }
  | {
      type: MessageFromWebviewType.REORDER_PLOTS_TEMPLATES
      payload: PlotsTemplatesReordered
    }
  | { type: MessageFromWebviewType.INITIALIZED }
  | { type: MessageFromWebviewType.SELECT_EXPERIMENTS }
  | { type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER }
  | { type: MessageFromWebviewType.SELECT_PLOTS }
  | { type: MessageFromWebviewType.REFRESH_REVISIONS }
  | { type: MessageFromWebviewType.SELECT_COLUMNS }
  | { type: MessageFromWebviewType.FOCUS_FILTERS_TREE }
  | { type: MessageFromWebviewType.FOCUS_SORTS_TREE }
  | { type: MessageFromWebviewType.OPEN_PLOTS_WEBVIEW }
  | {
      type: MessageFromWebviewType.SET_EXPERIMENTS_FOR_PLOTS
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.SET_EXPERIMENTS_AND_OPEN_PLOTS
      payload: string[]
    }
  | {
      type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
      payload: boolean
    }
  | { type: MessageFromWebviewType.SET_EXPERIMENTS_HEADER_HEIGHT }
  | { type: MessageFromWebviewType.CHECK_CLI_COMPATIBLE }
  | { type: MessageFromWebviewType.INITIALIZE_DVC }
  | { type: MessageFromWebviewType.INITIALIZE_GIT }
  | { type: MessageFromWebviewType.SHOW_SCM_PANEL }
  | { type: MessageFromWebviewType.INSTALL_DVC }
  | { type: MessageFromWebviewType.UPGRADE_DVC }
  | { type: MessageFromWebviewType.SETUP_WORKSPACE }
  | { type: MessageFromWebviewType.OPEN_STUDIO }
  | { type: MessageFromWebviewType.OPEN_STUDIO_PROFILE }
  | { type: MessageFromWebviewType.SAVE_STUDIO_TOKEN }
  | { type: MessageFromWebviewType.ADD_CONFIGURATION }
  | { type: MessageFromWebviewType.ZOOM_PLOT; payload?: string }
  | { type: MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW }
  | { type: MessageFromWebviewType.SHOW_MORE_COMMITS; payload: string }
  | { type: MessageFromWebviewType.SHOW_LESS_COMMITS; payload: string }
  | { type: MessageFromWebviewType.SWITCH_BRANCHES_VIEW }
  | { type: MessageFromWebviewType.SWITCH_COMMITS_VIEW }
  | { type: MessageFromWebviewType.SELECT_BRANCHES }

export type MessageToWebview<T extends WebviewData> = {
  type: MessageToWebviewType.SET_DATA
  data: T
}

export enum MessageToWebviewType {
  SET_DATA = 'setData'
}
