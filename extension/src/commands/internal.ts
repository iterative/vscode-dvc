import { commands } from 'vscode'
import { RegisteredCliCommands, RegisteredCommands } from './external'
import { ICli } from '../cli'
import { Args } from '../cli/constants'
import { autoRegisteredCommands as CliExecutorCommands } from '../cli/executor'
import { autoRegisteredCommands as CliReaderCommands } from '../cli/reader'
import { autoRegisteredCommands as CliRunnerCommands } from '../cli/runner'
import { sendTelemetryEvent, sendTelemetryEventAndThrow } from '../telemetry'
import { StopWatch } from '../util/time'
import { OutputChannel } from '../vscode/outputChannel'
import { Toast } from '../vscode/toast'
import { Response } from '../vscode/response'
import { Disposable } from '../class/dispose'

type Command = (...args: Args) => unknown | Promise<unknown>

export const AvailableCommands = Object.assign(
  {} as const,
  CliExecutorCommands,
  CliReaderCommands,
  CliRunnerCommands
)
export type CommandId = typeof AvailableCommands[keyof typeof AvailableCommands]

export class InternalCommands extends Disposable {
  private readonly commands = new Map<string, Command>()
  private readonly outputChannel: OutputChannel

  constructor(outputChannel: OutputChannel, ...cliInteractors: ICli[]) {
    super()

    for (const cli of cliInteractors) {
      this.autoRegisterCommands(cli)
    }
    this.outputChannel = outputChannel
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

  public registerExternalCliCommand<T = string | undefined>(
    name: RegisteredCliCommands,
    func: (arg: T) => unknown
  ): void {
    this.dispose.track(
      commands.registerCommand(name, async (arg: T) => {
        try {
          return await this.runAndSendTelemetry<T>(name, func, arg)
        } catch {
          this.offerToShowError()
        }
      })
    )
  }

  public registerExternalCommand<T = string | undefined>(
    name: RegisteredCommands,
    func: (arg: T) => unknown
  ): void {
    this.dispose.track(
      commands.registerCommand(name, (arg: T) =>
        this.runAndSendTelemetry<T>(name, func, arg)
      )
    )
  }

  private async runAndSendTelemetry<T>(
    name: RegisteredCommands | RegisteredCliCommands,
    func: (arg: T) => unknown,
    arg: T
  ) {
    const stopWatch = new StopWatch()
    try {
      const res = await func(arg)
      sendTelemetryEvent(name, undefined, {
        duration: stopWatch.getElapsedTime()
      })
      return res
    } catch (error: unknown) {
      return sendTelemetryEventAndThrow(
        name,
        error as Error,
        stopWatch.getElapsedTime()
      )
    }
  }

  private autoRegisterCommands(cli: ICli) {
    for (const commandId of cli.autoRegisteredCommands) {
      if (!this.confirmedId(commandId)) {
        throw new Error(
          'This should be an impossible error. ' +
            'If you are a user and see this message then you win a prize.'
        )
      }
      this.registerCommand(
        commandId,
        (dvcRoot: string, ...args: Args): Promise<string> =>
          (cli[commandId as keyof typeof cli] as Function)(dvcRoot, ...args)
      )
    }
  }

  private confirmedId(commandId: string): commandId is CommandId {
    return Object.values(AvailableCommands).includes(commandId as CommandId)
  }

  private async offerToShowError() {
    const response = await Toast.errorWithOptions(
      'Something went wrong, please see the DVC output channel for more details.',
      Response.SHOW,
      Response.CLOSE
    )
    if (response === Response.SHOW) {
      return this.outputChannel.show()
    }
  }
}
