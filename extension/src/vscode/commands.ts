import { commands } from 'vscode'
import {
  ExecutionOnTargetOptions,
  getExecutionOnTargetOptions
} from '../cli/executor'
import { Config } from '../Config'

export const registerPathCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOnTargetOptions) => Promise<string>
) =>
  commands.registerCommand(name, path => {
    const options = getExecutionOnTargetOptions(config, path)
    return func(options)
  })

export const registerRootUriCommand = (
  name: string,
  func: (cwd: string) => Promise<string>
) =>
  commands.registerCommand(name, ({ rootUri }) => {
    return func(rootUri.fsPath)
  })

export const registerResourceUriCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOnTargetOptions) => Promise<string>
) =>
  commands.registerCommand(name, ({ resourceUri }) => {
    const options = getExecutionOnTargetOptions(config, resourceUri.fsPath)
    return func(options)
  })
