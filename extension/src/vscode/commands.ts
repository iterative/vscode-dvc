import { commands } from 'vscode'
import { ExecutionOptions } from '../cli/execution'
import { ExecutionOnTargetOptions } from '../cli/executor'
import { Config } from '../Config'

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
  commands.registerCommand(name, ({ resourceUri }) =>
    func({
      fsPath: resourceUri.fsPath,
      cliPath: config.getCliPath(),
      pythonBinPath: config.pythonBinPath
    })
  )
