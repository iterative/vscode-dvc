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
    GET_FIRST_WORKSPACE_FOLDER_ROOT: 'getFirstWorkspaceFolderRoot',
    GET_THEME: 'getTheme'
  } as const,
  CliExecutorCommands,
  CliReaderCommands,
  CliRunnerCommands
)
export type CommandId = typeof AvailableCommands[keyof typeof AvailableCommands]

export class InternalCommands {
  public dispose = Disposable.fn()

  private readonly commands = new Map<string, Command>()

  constructor(config: Config, ...cliInteractors: ICli[]) {
    cliInteractors.forEach(cli => this.autoRegisterCommands(cli))

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
    this.registerCommand(
      AvailableCommands.GET_FIRST_WORKSPACE_FOLDER_ROOT,
      () => config.getFirstWorkspaceFolderRoot()
    )
  }

  public executeCommand<T = string>(
    commandId: CommandId,
    ...args: Args
  ): Promise<T> {
    const command = this.commands.get(commandId)
    if (!command) {
      throw new Error('Unknown command')
    }

    return command(...args) as Promise<T>
  }

  public registerCommand(commandId: CommandId, command: Command): void {
    if (this.commands.has(commandId)) {
      throw new Error(`command '${commandId}' already exists`)
    }

    this.commands.set(commandId, command)
  }

  private autoRegisterCommands(cli: ICli) {
    cli.autoRegisteredCommands.forEach((commandId: string) => {
      if (!this.confirmedId(commandId)) {
        throw new Error(
          `This should be an impossible error. ` +
            'If you are a user and see this message then you win a prize.'
        )
      }
      this.registerCommand(
        commandId,
        (dvcRoot: string, ...args: Args): Promise<string> =>
          (cli[commandId as keyof typeof cli] as Function)(dvcRoot, ...args)
      )
    })
  }

  private confirmedId(commandId: string): commandId is CommandId {
    return Object.values(AvailableCommands).includes(commandId as CommandId)
  }
}
