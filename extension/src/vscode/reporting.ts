import { window } from 'vscode'
import { Args } from '../cli/args'

interface MaybeConsoleError extends Error {
  stderr?: string
}

export interface ExecutionOptions {
  executable: string
  args: Args
  cwd: string
  env: NodeJS.ProcessEnv
}

interface CLIProcessErrorArgs {
  options: ExecutionOptions
  baseError: MaybeConsoleError
  message?: string
}

export class CliProcessError extends Error {
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

export const reportErrorMessage = (error: MaybeConsoleError) =>
  window.showErrorMessage(error.stderr || error.message)
