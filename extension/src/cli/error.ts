import { ProcessOptions } from '../processExecution'

export interface MaybeConsoleError extends Error {
  stderr?: string
  exitCode: number
}

interface CliProcessErrorArgs {
  options: ProcessOptions
  baseError: MaybeConsoleError
  message?: string
}

export class CliError extends Error {
  public readonly options?: ProcessOptions
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
