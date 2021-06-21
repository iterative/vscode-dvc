import { Disposable } from '@hediet/std/disposable'
import { Args } from './cli/args'
import { CliExecutor } from './cli/executor'
import { CliReader } from './cli/reader'

type Command = (...args: Args) => unknown | Promise<unknown>

export enum AvailableCommands {
  ADD = 'add',
  CHECKOUT = 'checkout',
  COMMIT = 'commit',
  DIFF = 'diff',
  INIT = 'init',
  LIST_DVC_ONLY = 'listDvcOnly',
  LIST_DVC_ONLY_RECURSIVE = 'listDvcOnlyRecursive',
  PULL = 'pull',
  PUSH = 'push',
  REMOVE = 'remove',
  STATUS = 'status'
}

export class InternalCommands {
  public dispose = Disposable.fn()

  private readonly commands = new Map<string, Command>()

  constructor(cliExecutor: CliExecutor, cliReader: CliReader) {
    this.registerCommands(cliExecutor)
    this.registerCommands(cliReader)
  }

  public executeCommand<T = string>(
    id: AvailableCommands,
    ...args: Args
  ): Promise<T> {
    const command = this.commands.get(id)
    if (!command) {
      throw new Error('Unknown command')
    }

    return command(...args) as Promise<T>
  }

  private registerCommands(cli: CliExecutor | CliReader) {
    cli.commandsToRegister.forEach((name: string) => {
      this.registerCommand(
        name,
        (dvcRoot: string, ...args: Args): Promise<string> =>
          (cli[name as keyof typeof cli] as Function)(dvcRoot, ...args)
      )
    })
  }

  private registerCommand(id: string, command: Command): void {
    if (!id.trim().length) {
      throw new Error('invalid id')
    }

    if (this.commands.has(id)) {
      throw new Error(`command '${id}' already exists`)
    }

    this.commands.set(id, command)
  }
}
