import { Commands } from './commands'
import { execPromise } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { workspace } from 'vscode'
import { relative } from 'path'
import { IntegratedTerminal } from '../IntegratedTerminal'

const getCliCommand = (command: string, ...options: string[]): string => {
  return `dvc ${command} ${options.join(' ')}`
}

interface ReaderOptions {
  cliPath: string
  cwd: string
}

const execCommand = (
  options: ReaderOptions,
  command: string
): Promise<{ stdout: string; stderr: string }> => {
  const { cliPath, cwd } = options

  return execPromise(`${cliPath} ${command}`, {
    cwd
  })
}

export const getExperiments = async (
  options: ReaderOptions
): Promise<ExperimentsRepoJSONOutput> => {
  const { stdout } = await execCommand(options, Commands.experiment_show)
  return JSON.parse(stdout)
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

export const initializeDirectory = (fsPath: string): Promise<void> => {
  const initializeDirectoryCommand = getInitializeDirectoryCommand(fsPath)
  return IntegratedTerminal.run(initializeDirectoryCommand)
}

export const add = (fsPath: string): Promise<void> => {
  const addCommand = getAddCommand(fsPath)
  return IntegratedTerminal.run(addCommand)
}

export const checkout = (fsPath: string): Promise<void> => {
  const checkoutCommand = getCheckoutCommand(fsPath)
  return IntegratedTerminal.run(checkoutCommand)
}

export const checkoutRecursive = (fsPath: string): Promise<void> => {
  const checkoutRecursiveCommand = getCheckoutRecursiveCommand(fsPath)
  return IntegratedTerminal.run(checkoutRecursiveCommand)
}
