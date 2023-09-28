export enum Title {
  CHOOSE_RESOURCES = 'Choose Resources to Add to the Dataset',
  ENTER_BRANCH_NAME = 'Enter a Name for the New Branch',
  ENTER_NEW_EXPERIMENT_NAME = 'Enter a New Name for the Experiment',
  ENTER_COMMAND_TO_RUN = 'Enter the Command to Run your Script (e.g., python, sh, go run...)',
  ENTER_COMMIT_MESSAGE = 'Enter a Commit Message',
  ENTER_EXPERIMENT_WORKER_COUNT = 'Enter the Number of Queue Workers',
  ENTER_FILTER_VALUE = 'Enter a Filter Value',
  ENTER_RELATIVE_DESTINATION = 'Enter a Destination Relative to the Root',
  ENTER_REMOTE_NAME = 'Enter a Name for the Remote',
  ENTER_REMOTE_URL = 'Enter the URL for the Remote',
  ENTER_PATH_OR_CHOOSE_FILE = 'Enter the path to your training script or select it',
  ENTER_STUDIO_USERNAME = 'Enter your Studio username',
  ENTER_STUDIO_TOKEN = 'Enter your Studio access token',
  ENTER_STAGE_NAME = 'Enter a Name for the Main Stage of your Pipeline',
  GARBAGE_COLLECT_EXPERIMENTS = 'Garbage Collect Experiments',
  SHOW_SETUP = 'Show Setup',
  SELECT_BRANCHES = 'Select the Branch(es) to Display in the Experiments Table',
  SELECT_BASE_EXPERIMENT = 'Select an Experiment to Use as a Base',
  SELECT_COLUMNS = 'Select Columns to Display in the Experiments Table',
  SELECT_EXPERIMENT = 'Select an Experiment',
  SELECT_EXPERIMENTS = 'Select Experiments',
  SELECT_EXPERIMENTS_PUSH = 'Select Experiment(s) to Push',
  SELECT_EXPERIMENTS_REMOVE = 'Select Experiment(s) to Remove',
  SELECT_EXPERIMENTS_TO_PLOT = 'Select up to 7 Experiments to Display in Plots',
  SELECT_FILTERS_TO_REMOVE = 'Select Filter(s) to Remove',
  SELECT_FIRST_COLUMNS = 'Select Column(s) to Display First in the Experiments Table',
  SELECT_FOCUSED_PROJECTS = 'Select Project(s) to Focus (set dvc.focusedProjects)',
  SELECT_OPERATOR = 'Select an Operator',
  SELECT_COLUMN_FILTER = 'Select a Column to Filter by',
  SELECT_COLUMN_SORT = 'Select a Column to Sort by',
  SELECT_METRIC_CUSTOM_PLOT = 'Select a Metric to Create a Custom Plot',
  SELECT_PARAM_CUSTOM_PLOT = 'Select a Param to Create a Custom Plot',
  SELECT_PLOT_TYPE_CUSTOM_PLOT = 'Select a Custom Plot Type',
  SELECT_CUSTOM_PLOTS_TO_REMOVE = 'Select Custom Plot(s) to Remove',
  SELECT_PARAM_TO_MODIFY = 'Select Param(s) to Modify',
  SELECT_PLOTS = 'Select Plots to Display',
  SELECT_REMOTE_TO_MODIFY = 'Select a Remote to Modify',
  SELECT_REMOTE_TO_REMOVE = 'Select a Remote to Remove',
  SELECT_EXPERIMENTS_STOP = 'Select Experiments to Stop',
  SELECT_SORT_DIRECTION = 'Select Sort Direction',
  SELECT_SORTS_TO_REMOVE = 'Select Sort(s) to Remove',
  SELECT_TRAINING_SCRIPT = 'Select your Training Script',
  SELECT_PLOT_X_METRIC = 'Select a Metric for X',
  SELECT_PLOT_Y_METRIC = 'Select a Metric for Y',
  SELECT_PLOT_DATA = 'Select Data to Plot',
  SELECT_PLOT_TYPE = 'Select Plot Type',
  SETUP_WORKSPACE = 'Setup the Workspace',
  SET_EXPERIMENTS_HEADER_HEIGHT = 'Set the Maximum Experiment Table Header Height',
  SET_REMOTE_AS_DEFAULT = 'Set Default Remote',
  UPDATE_PYTHON_ENVIRONMENT = 'Update Python Environment (selected with the Python Extension)'
}

export const getEnterValueTitle = (path: string): Title =>
  `Enter a Value for ${path}` as unknown as Title

export const getSelectTitle = (text: string): Title =>
  `Select a ${text}` as unknown as Title
