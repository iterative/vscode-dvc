import { Disposable } from '@hediet/std/disposable'
import { Args } from './cli/args'

interface CommandHandler {
  callback: Function
  thisArg: unknown
}

export class InternalCommands {
  public dispose = Disposable.fn()

  private readonly _commands = new Map<string, CommandHandler>()

  registerCommand(
    id: string,
    callback: (...args: Args) => unknown | Promise<unknown>,
    thisArg?: unknown
  ): void {
    if (!id.trim().length) {
      throw new Error('invalid id')
    }

    if (this._commands.has(id)) {
      throw new Error(`command '${id}' already exists`)
    }

    this._commands.set(id, { callback, thisArg })
  }

  executeCommand<T>(id: string, ...args: unknown[]): Promise<T> {
    return this._doExecuteCommand(id, args)
  }

  private _doExecuteCommand<T>(id: string, args: unknown[]): T {
    const command = this._commands.get(id)
    if (!command) {
      throw new Error('Unknown command')
    }
    const { callback, thisArg } = command

    return callback.apply(thisArg, args)
  }
}
