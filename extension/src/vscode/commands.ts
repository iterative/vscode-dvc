import { commands } from 'vscode'
import {
  ExecutionOnTargetOptions,
  getExecutionOnTargetOptions
} from '../cli/executor'
import { Config } from '../Config'

export const registerPathCommand_ = (
  name: string,
  func: (cwd: string) => Promise<string>
) =>
  commands.registerCommand(name, path => {
    return func(path)
  })

export const registerPathCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOnTargetOptions) => Promise<string>
) =>
  commands.registerCommand(name, path => {
    const options = getExecutionOnTargetOptions(config, path)
    return func(options)
  })

export const registerUriCommand = (
  name: string,
  uriName: 'rootUri' | 'resourceUri',
  func: (fsPath: string) => Promise<string>
) => commands.registerCommand(name, context => func(context[uriName].fsPath))
