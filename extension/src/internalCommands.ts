import { Disposable } from '@hediet/std/disposable'
import { ICli } from './cli'
import { Args } from './cli/args'
import { Config } from './config'
import { quickPickOne } from './vscode/quickPick'
import { autoRegisteredCommands as CliExecutorCommands } from './cli/executor'
import { autoRegisteredCommands as CliReaderCommands } from './cli/reader'
import { autoRegisteredCommands as CliRunnerCommands } from './cli/runner'

type Command = (...args: Args) => unknown | Promise<unknown>

export const AvailableCommands = Object.assign(
  {
    GET_DEFAULT_OR_PICK_PROJECT: 'getDefaultOrPickProject',
    GET_THEME: 'getTheme'
  },
  CliExecutorCommands,
  CliReaderCommands,
  CliRunnerCommands
)
export type AvailableCommands =
  typeof AvailableCommands[keyof typeof AvailableCommands]

export class InternalCommands {
  public dispose = Disposable.fn()

  private readonly commands = new Map<string, Command>()

  constructor(config: Config, ...cliInteractors: ICli[]) {
    cliInteractors.forEach(cli => this.registerCommands(cli))

    this.registerCommand(
      AvailableCommands.GET_DEFAULT_OR_PICK_PROJECT,
      (...dvcRoots: string[]) => {
        if (dvcRoots.length === 1) {
          return dvcRoots[0]
        }

        return (
          config.getDefaultProject() ||
          quickPickOne(dvcRoots, 'Select which project to run command against')
        )
      }
    )

    this.registerCommand(AvailableCommands.GET_THEME, () => config.getTheme())
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

  private registerCommand(id: string, command: Command): void {
    if (!id.trim().length) {
      throw new Error('invalid id')
    }

    if (this.commands.has(id)) {
      throw new Error(`command '${id}' already exists`)
    }

    this.commands.set(id, command)
  }

  private registerCommands(cli: ICli) {
    cli.autoRegisteredCommands.forEach((name: string) => {
      this.registerCommand(
        name,
        (dvcRoot: string, ...args: Args): Promise<string> =>
          (cli[name as keyof typeof cli] as Function)(dvcRoot, ...args)
      )
    })
  }
}
