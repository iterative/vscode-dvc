import { commands } from 'vscode'

export enum ContextKey {
  CLI_INCOMPATIBLE = 'dvc.cli.incompatible',
  COMMANDS_AVAILABLE = 'dvc.commands.available',
  EXPERIMENT_CHECKPOINTS = 'dvc.experiment.checkpoints',
  EXPERIMENT_RUNNING = 'dvc.experiment.running',
  EXPERIMENT_RUNNING_WORKSPACE = 'dvc.experiment.running.workspace',
  EXPERIMENTS_FILE_ACTIVE = 'dvc.experiments.file.active',
  EXPERIMENTS_FILTERED = 'dvc.experiments.filtered',
  EXPERIMENTS_SORTED = 'dvc.experiments.sorted',
  EXPERIMENTS_WEBVIEW_ACTIVE = 'dvc.experiments.webview.active',
  MULTIPLE_PROJECTS = 'dvc.multiple.projects',
  PIPELINE_FILE_ACTIVE = 'dvc.pipeline.file.active',
  PLOTS_WEBVIEW_ACTIVE = 'dvc.plots.webview.active',
  PROJECT_AVAILABLE = 'dvc.project.available',
  PROJECT_HAS_DATA = 'dvc.project.hasData',
  SCM_RUNNING = 'dvc.scm.command.running',
  SETUP_WEBVIEW_ACTIVE = 'dvc.setup.webview.active',
  STUDIO_CONNECTED = 'dvc.studio.connected',
  STUDIO_SELFHOSTED = 'dvc.studio.selfhosted'
}

export const setContextValue = (key: ContextKey, value: unknown) =>
  commands.executeCommand('setContext', key, value)

export type Context = string | Record<string, unknown> | undefined

export const getDvcRootFromContext = (context: Context): string => {
  const isDvcRoot = typeof context === 'string'
  return isDvcRoot ? context : ''
}
