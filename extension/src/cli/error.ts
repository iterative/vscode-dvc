import { Args } from '../cli/args'

export interface MaybeConsoleError extends Error {
  stderr?: string
}

interface ExecutionOptions {
  executable: string
  args: Args
  cwd: string
}

interface CLIProcessErrorArgs {
  options: ExecutionOptions
  baseError: MaybeConsoleError
  message?: string
}

export class CliError extends Error {
  public readonly options?: ExecutionOptions
  public readonly baseError: Error
  public readonly stderr?: string

  constructor({ message, options, baseError }: CLIProcessErrorArgs) {
    super(message || baseError.message)
    this.options = options
    this.baseError = baseError
    this.stderr = baseError.stderr
  }
}
