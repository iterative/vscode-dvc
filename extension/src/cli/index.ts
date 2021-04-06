import { basename } from 'path'
import { Commands } from './commands'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getPythonExecutionDetails } from '../extensions/python'
import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../Config'
import { execPromise } from '../util'

export const getDvcInvocation = async (config: Config) => {
  const dvcPath = config.dvcPath
  if (dvcPath) {
    return dvcPath
  }
  const executionDetails = await getPythonExecutionDetails()
  return executionDetails ? `${executionDetails.join(' ')} -m dvc` : 'dvc'
}

export const execCommand = async (
  config: Config,
  command: string,
  execPromiseConfig = {
    cwd: config.workspaceRoot
  }
): Promise<string> => {
  const fullCommandString = `${await getDvcInvocation(config)} ${command}`
  return (await execPromise(fullCommandString, execPromiseConfig)).stdout
}
export const add = (config: Config, fsPath: string): Promise<string> => {
  const toAdd = basename(fsPath)

  return execCommand(config, `add ${toAdd}`)
}

export const getExperiments = async (
  config: Config
): Promise<ExperimentsRepoJSONOutput> => {
  const output = await execCommand(config, Commands.experiment_show)
  return JSON.parse(output)
}

export const initializeDirectory = async (config: Config): Promise<string> => {
  return execCommand(config, Commands.initialize_subdirectory)
}

export const checkout = async (config: Config): Promise<string> => {
  return execCommand(config, Commands.checkout)
}

export const checkoutRecursive = async (config: Config): Promise<string> => {
  return execCommand(config, Commands.checkout_recursive)
}

export const getRoot = async (config: Config, cwd: string): Promise<string> => {
  const output = await execCommand(config, Commands.root, { cwd })
  return output.trim()
}

export const listDvcOnlyRecursive = async (
  config: Config
): Promise<string[]> => {
  const output = await execCommand(config, `list . --dvc-only -R`)
  return output.trim().split('\n')
}

export const registerDvcCommands = ({
  dispose,
  config
}: {
  dispose: Disposer
  config: Config
}) => {
  dispose.track(
    commands.registerCommand('dvc.initializeDirectory', () => {
      initializeDirectory(config)
    })
  )

  dispose.track(
    commands.registerCommand('dvc.add', ({ resourceUri }) =>
      add(config, resourceUri)
    )
  )

  dispose.track(
    commands.registerCommand('dvc.checkout', () => {
      checkout(config)
    })
  )

  dispose.track(
    commands.registerCommand('dvc.checkoutRecursive', () => {
      checkoutRecursive(config)
    })
  )
}
