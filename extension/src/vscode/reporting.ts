import { ExecutionOptions } from '../cli/execution'

interface CLIProcessErrorArgs {
  args: string[]
  options: ExecutionOptions
  baseError: Error
  message?: string
}

export class CliProcessError extends Error {
  args: string[]
  options: ExecutionOptions
  baseError: Error

  constructor({ message, args, options, baseError }: CLIProcessErrorArgs) {
    super(message || baseError.message)
    this.args = args
    this.options = options
    this.baseError = baseError
  }
}
