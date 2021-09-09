import { ExecutionOptions } from './options'

export interface MaybeConsoleError extends Error {
  stderr?: string
  exitCode: number
}

interface CliProcessErrorArgs {
  options: ExecutionOptions
  baseError: MaybeConsoleError
  message?: string
}

export class CliError extends Error {
  public readonly options?: ExecutionOptions
  public readonly baseError: Error
  public readonly stderr?: string
  public readonly exitCode: number | null

  constructor({ message, options, baseError }: CliProcessErrorArgs) {
    super(message || baseError.message)
    this.options = options
    this.baseError = baseError
    this.stderr = baseError.stderr
    this.exitCode = baseError.exitCode
  }
}
