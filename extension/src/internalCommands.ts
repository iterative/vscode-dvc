import { Disposable } from '@hediet/std/disposable'
import { Args } from './cli/args'

type Command = (...args: Args) => unknown | Promise<unknown>

export class InternalCommands {
  public dispose = Disposable.fn()

  private readonly commands = new Map<string, Command>()

  public registerCommand(id: string, command: Command): void {
    if (!id.trim().length) {
      throw new Error('invalid id')
    }

    if (this.commands.has(id)) {
      throw new Error(`command '${id}' already exists`)
    }

    this.commands.set(id, command)
  }

  public executeCommand<T = string>(id: string, ...args: Args): Promise<T> {
    const command = this.commands.get(id)
    if (!command) {
      throw new Error('Unknown command')
    }

    return command(...args) as Promise<T>
  }
}
