import { commands } from 'vscode'
import { ExecutionOptions, getExecutionOptions } from '../cli/execution'
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
  config: Config,
  name: string,
  func: (options: ExecutionOptions) => Promise<string>
) =>
  commands.registerCommand(name, ({ rootUri }) => {
    const options = getExecutionOptions(config, rootUri.fsPath)
    return func(options)
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
