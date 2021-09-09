import { commands } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { RegisteredCommands } from './external'
import { ICli } from '../cli'
import { Args } from '../cli/args'
import { autoRegisteredCommands as CliExecutorCommands } from '../cli/executor'
import { autoRegisteredCommands as CliReaderCommands } from '../cli/reader'
import { autoRegisteredCommands as CliRunnerCommands } from '../cli/runner'
import { Config } from '../config'
import { OutputChannel } from '../vscode/outputChannel'
import { quickPickOne } from '../vscode/quickPick'
import { StopWatch } from '../util/time'
import { sendTelemetryEvent, sendTelemetryEventAndThrow } from '../telemetry'
import { showGenericError } from '../vscode/modal'

type Command = (...args: Args) => unknown | Promise<unknown>

export const AvailableCommands = Object.assign(
  {
    GET_DEFAULT_OR_PICK_PROJECT: 'getDefaultOrPickProject',
    GET_THEME: 'getTheme',
    REGISTER_EXTERNAL_COMMAND: 'registerExternalCommand'
  } as const,
  CliExecutorCommands,
  CliReaderCommands,
  CliRunnerCommands
)
export type CommandId = typeof AvailableCommands[keyof typeof AvailableCommands]

export class InternalCommands {
  public dispose = Disposable.fn()

  private readonly commands = new Map<string, Command>()
  private readonly outputChannel: OutputChannel

  constructor(
    config: Config,
    outputChannel: OutputChannel,
    ...cliInteractors: ICli[]
  ) {
    cliInteractors.forEach(cli => this.autoRegisterCommands(cli))
    this.outputChannel = outputChannel

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

  public registerExternalCommand<T = string | undefined>(
    name: RegisteredCommands,
    func: (arg: T) => unknown
  ): Disposable {
    return commands.registerCommand(name, async arg => {
      const stopWatch = new StopWatch()
      try {
        const res = await func(arg)
        sendTelemetryEvent(name, undefined, {
          duration: stopWatch.getElapsedTime()
        })
        return res
      } catch (e: unknown) {
        showGenericError()
        this.outputChannel.show()
        sendTelemetryEventAndThrow(name, e as Error, stopWatch.getElapsedTime())
      }
    })
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
