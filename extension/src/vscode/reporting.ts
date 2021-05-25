import { window } from 'vscode'
import { ExecutionOptions } from '../cli/execution'

interface MaybeConsoleError extends Error {
  stderr?: string
}

interface CLIProcessErrorArgs {
  args: string[]
  options: ExecutionOptions
  baseError: MaybeConsoleError
  message?: string
}

export class CliProcessError extends Error {
  public readonly args: string[]
  public readonly options: ExecutionOptions
  public readonly baseError: Error
  public readonly stderr?: string

  constructor({ message, args, options, baseError }: CLIProcessErrorArgs) {
    super(message || baseError.message)
    this.args = args
    this.options = options
    this.baseError = baseError
    this.stderr = baseError.stderr
  }
}

const inferErrorMessage = (error: CliProcessError | Error): string =>
  error instanceof CliProcessError
    ? `Error running command "dvc ${error.args.join(' ')}"!`
    : error.message

export const showCliProcessError = (
  error: MaybeConsoleError,
  message: string = inferErrorMessage(error)
) => window.showErrorMessage(message)
