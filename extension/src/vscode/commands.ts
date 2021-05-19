import { commands } from 'vscode'
import { ExecutionOptions } from '../cli/execution'
import { ExecutionOnTargetOptions } from '../cli/executor'
import { Config } from '../Config'

const getOptions = (config: Config, path: string) => ({
  fsPath: path,
  cliPath: config.getCliPath(),
  pythonBinPath: config.pythonBinPath
})

export const registerPathCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOnTargetOptions) => Promise<string>
) =>
  commands.registerCommand(name, path => {
    const options = getOptions(config, path)
    return func(options)
  })

export const registerRootUriCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOptions) => Promise<string>
) =>
  commands.registerCommand(name, ({ rootUri }) =>
    func({
      cwd: rootUri.fsPath,
      cliPath: config.getCliPath(),
      pythonBinPath: config.pythonBinPath
    })
  )

export const registerResourceUriCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOnTargetOptions) => Promise<string>
) =>
  commands.registerCommand(name, ({ resourceUri }) => {
    const options = getOptions(config, resourceUri.fsPath)
    return func(options)
  })
