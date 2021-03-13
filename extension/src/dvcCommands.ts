/* eslint-disable no-console */
import { workspace, Uri } from 'vscode'
import { relative } from 'path'

const getCliCommand = (command: string, ...options: string[]): string => {
  return `dvc ${command} ${options.join(' ')}`
}

const getDefaultCwd = (): string => {
  const { workspaceFolders } = workspace
  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error('There are no folders in the Workspace to operate on!')
  }

  return workspaceFolders[0].uri.fsPath
}

const RUN_EXPERIMENT = 'exp run'
const INITIALIZE_DIRECTORY = 'init --subdir'
const ADD = 'add'
const CHECKOUT = 'checkout'
const CHECKOUT_RECURSIVE = 'checkout --recursive'
const PUSH = 'push'

export const getRunExperimentCommand = (): string => {
  return getCliCommand(RUN_EXPERIMENT)
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

export const getPushCommand = (options: DvcTrackedItem | undefined): string => {
  const path = options
    ? Uri.file(relative(getDefaultCwd(), options.uri.fsPath)).path.substring(1)
    : ''

  return getCliCommand(PUSH, path)
}
