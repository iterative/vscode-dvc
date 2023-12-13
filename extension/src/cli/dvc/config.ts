import { DvcCli } from '.'
import { Args, Command, SubCommand } from './constants'
import { typeCheckCommands } from '..'

export const autoRegisteredCommands = {
  CONFIG: 'config',
  REMOTE: 'remote',
  REMOTE_ADD: 'remoteAdd',
  REMOTE_MODIFY: 'remoteModify',
  REMOTE_RENAME: 'remoteRename'
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

  public remoteAdd(cwd: string, ...args: Args) {
    return this.executeDvcProcess(cwd, Command.REMOTE, SubCommand.ADD, ...args)
  }

  public remoteRename(cwd: string, ...args: Args) {
    return this.executeDvcProcess(
      cwd,
      Command.REMOTE,
      SubCommand.RENAME,
      ...args
    )
  }

  public remoteModify(cwd: string, ...args: Args) {
    return this.executeDvcProcess(
      cwd,
      Command.REMOTE,
      SubCommand.MODIFY,
      ...args
    )
  }

  private async executeSafeProcess(
    cwd: string,
    command: Command,
    ...args: Args
  ) {
    try {
      return await this.executeDvcProcess(cwd, command, ...args)
    } catch {}
  }
}
