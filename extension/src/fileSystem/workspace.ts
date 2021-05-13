import { Uri, window, workspace, WorkspaceEdit } from 'vscode'
import { findDvcRootPaths } from '.'
import { ExecutionOptions } from '../cli/execution'
import { Config } from '../Config'

export const deleteTarget = (path: string) => {
  const edit = new WorkspaceEdit()
  edit.deleteFile(Uri.file(path), { ignoreIfNotExists: true, recursive: true })
  return workspace.applyEdit(edit)
}

export const pickDvcRoot = async (
  config: Config
): Promise<string | undefined> => {
  const defaultProject = config.getDefaultProject()
  if (defaultProject) {
    return defaultProject
  }

  const options = config.getExecutionOptions()

  const dvcRoots = await findDvcRootPaths(options)
  if (dvcRoots.length === 1) {
    return dvcRoots[0]
  }

  return window.showQuickPick(dvcRoots, {
    canPickMany: false,
    placeHolder: 'Select which repository to run command against'
  })
}

export const pickDvcRootThenRun = async (
  config: Config,
  func: (options: ExecutionOptions) => unknown
) => {
  const dvcRoot = await pickDvcRoot(config)
  if (dvcRoot) {
    const options = { ...config.getExecutionOptions(), cwd: dvcRoot }
    return func(options)
  }
}
