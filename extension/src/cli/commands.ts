import { workspace } from 'vscode'
import { relative } from 'path'

const getCliCommand = (command: string, ...options: string[]): string => {
  return `dvc ${command} ${options.join(' ')}`
}

const EXPERIMENT_RUN = 'exp run'
export const EXPERIMENT_SHOW = 'exp show --show-json'
const INITIALIZE_DIRECTORY = 'init --subdir'
const ADD = 'add'
const CHECKOUT = 'checkout'
const CHECKOUT_RECURSIVE = 'checkout --recursive'

export const getRunExperimentCommand = (): string => {
  return getCliCommand(EXPERIMENT_RUN)
}

export const getInitializeDirectoryCommand = (fsPath: string): string => {
  // need to return cwd to workspace root or find better implementation
  return `cd ${fsPath} && ${getCliCommand(INITIALIZE_DIRECTORY)}`
}

export const getAddCommand = (fsPath: string): string => {
  if (workspace.workspaceFolders !== undefined) {
    const relativePath = relative(
      workspace.workspaceFolders[0].uri.fsPath,
      fsPath
    )

    return getCliCommand(ADD, relativePath)
  } else {
    throw new Error('No workspace open')
  }
}

export const getCheckoutCommand = (fsPath: string): string => {
  return getCliCommand(CHECKOUT, fsPath)
}

export const getCheckoutRecursiveCommand = (fsPath: string): string => {
  return getCliCommand(CHECKOUT_RECURSIVE, fsPath)
}
