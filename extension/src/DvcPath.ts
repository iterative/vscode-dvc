import { workspace } from 'vscode'

export const getDvcPath = (): string =>
  workspace.getConfiguration().get('dvc.dvcPath') || 'dvc'
