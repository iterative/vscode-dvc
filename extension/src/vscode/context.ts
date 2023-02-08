import { commands } from 'vscode'

export enum ContextKey {
  COMMANDS_AVAILABLE = 'dvc.commands.available',
  CLI_INCOMPATIBLE = 'dvc.cli.incompatible',
  EXPERIMENT_CHECKPOINTS = 'dvc.experiment.checkpoints',
  EXPERIMENT_FILTERS_SELECTED = 'dvc.experiments.filter.selected',
  EXPERIMENTS_WEBVIEW_ACTIVE = 'dvc.experiments.webview.active',
  EXPERIMENT_RUNNING = 'dvc.experiment.running',
  EXPERIMENTS_FILTERED = 'dvc.experiments.filtered',
  EXPERIMENTS_SORTED = 'dvc.experiments.sorted',
  MULTIPLE_PROJECTS = 'dvc.multiple.projects',
  PARAMS_FILE_ACTIVE = 'dvc.params.file.active',
  PLOTS_WEBVIEW_ACTIVE = 'dvc.plots.webview.active',
  PROJECT_AVAILABLE = 'dvc.project.available',
  PROJECT_HAS_DATA = 'dvc.project.hasData',
  SCM_RUNNING = 'dvc.scm.command.running',
  SETUP_WEBVIEW_ACTIVE = 'dvc.setup.webview.active'
}

export const setContextValue = (key: ContextKey, value: unknown) =>
  commands.executeCommand('setContext', key, value)

export type Context = string | Record<string, unknown> | undefined

export const getDvcRootFromContext = (context: Context): string => {
  const isDvcRoot = typeof context === 'string'
  return isDvcRoot ? context : ''
}
