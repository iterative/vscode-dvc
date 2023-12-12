import { DvcCli } from '.'
import { Args, Command } from './constants'
import { typeCheckCommands } from '..'
import { MaybeConsoleError } from '../error'

export const autoRegisteredCommands = {
  CONFIG: 'config',
  REMOTE: 'remote'
} as const

export class DvcConfig extends DvcCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public config(cwd: string, ...args: Args) {
    return this.executeSafeProcess(cwd, Command.CONFIG, ...args)
  }

  public remote(cwd: string, ...args: Args) {
    return this.executeSafeProcess(cwd, Command.REMOTE, ...args)
  }

  private async executeSafeProcess(
    cwd: string,
    command: Command,
    ...args: Args
  ) {
    try {
      return await this.executeDvcProcess(cwd, command, ...args)
    } catch (error: unknown) {
      const message =
        (error as MaybeConsoleError).stderr || (error as Error).message
      return `${[command, ...args].join(' ')} failed with ${message}`
    }
  }
}
