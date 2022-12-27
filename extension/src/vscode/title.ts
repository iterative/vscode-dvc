export enum Title {
  CHOOSE_RESOURCES = 'Choose Resources to Add to the Dataset',
  ENTER_BRANCH_NAME = 'Enter a Name for the New Branch',
  ENTER_COMMIT_MESSAGE = 'Enter a Commit Message',
  ENTER_FILTER_VALUE = 'Enter a Filter Value',
  ENTER_RELATIVE_DESTINATION = 'Enter a Destination Relative to the Root',
  GARBAGE_COLLECT_EXPERIMENTS = 'Garbage Collect Experiments',
  SHOW_SETUP = 'Show Setup',
  SELECT_BASE_EXPERIMENT = 'Select an Experiment to Use as a Base',
  SELECT_COLUMNS = 'Select Columns to Display in the Experiments Table',
  SELECT_EXPERIMENT = 'Select an Experiment',
  SELECT_EXPERIMENTS = 'Select up to 7 Experiments to Display in Plots',
  SELECT_FILTERS_TO_REMOVE = 'Select Filter(s) to Remove',
  SELECT_OPERATOR = 'Select an Operator',
  SELECT_PARAM_OR_METRIC_FILTER = 'Select a Param or Metric to Filter by',
  SELECT_PARAM_OR_METRIC_SORT = 'Select a Param or Metric to Sort by',
  SELECT_PARAM_TO_MODIFY = 'Select Param(s) to Modify',
  SELECT_PLOTS = 'Select Plots to Display',
  SELECT_SORT_DIRECTION = 'Select Sort Direction',
  SELECT_SORTS_TO_REMOVE = 'Select Sort(s) to Remove',
  SETUP_WORKSPACE = 'Setup the Workspace',
  SET_EXPERIMENTS_HEADER_HEIGHT = 'Set Maximum Experiment Table Header Height'
}

export const getEnterValueTitle = (path: string): Title =>
  `Enter a Value for ${path}` as unknown as Title

export const getSelectTitle = (text: string): Title =>
  `Select a ${text}` as unknown as Title
