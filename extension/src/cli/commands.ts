import { workspace } from 'vscode'
import { relative } from 'path'

const getCliCommand = (command: string, ...options: string[]): string => {
  return `dvc ${command} ${options.join(' ')}`
}

export enum Commands {
  experiment_run = 'exp run',
  experiment_show = 'exp show --show-json',
  initialize_subdirectory = 'init --subdir',
  add = 'add',
  checkout = 'checkout',
  checkout_recursive = 'checkout --recursive'
}

export const getRunExperimentCommand = (): string => {
  return getCliCommand(Commands.experiment_run)
}

export const getInitializeDirectoryCommand = (fsPath: string): string => {
  // need to return cwd to workspace root or find better implementation
  return `cd ${fsPath} && ${getCliCommand(Commands.initialize_subdirectory)}`
}

export const getAddCommand = (fsPath: string): string => {
  if (workspace.workspaceFolders !== undefined) {
    const relativePath = relative(
      workspace.workspaceFolders[0].uri.fsPath,
      fsPath
    )

    return getCliCommand(Commands.add, relativePath)
  } else {
    throw new Error('No workspace open')
  }
}

export const getCheckoutCommand = (fsPath: string): string => {
  return getCliCommand(Commands.checkout, fsPath)
}

export const getCheckoutRecursiveCommand = (fsPath: string): string => {
  return getCliCommand(Commands.checkout_recursive, fsPath)
}
