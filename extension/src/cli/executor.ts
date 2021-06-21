import { EventEmitter } from 'vscode'
import { Cli, CliResult } from '.'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommand,
  Flag,
  GcPreserveFlag
} from './args'
import { Config } from '../config'
import { InternalCommands } from '../internalCommands'

export class CliExecutor extends Cli {
  constructor(
    config: Config,
    internalCommands: InternalCommands,
    emitters?: {
      processStarted: EventEmitter<void>
      processCompleted: EventEmitter<CliResult>
    }
  ) {
    super(config, emitters)

    const commandsToRegister = [
      'add',
      'checkout',
      'commit',
      'init',
      'pull',
      'push',
      'remove'
    ]

    commandsToRegister.forEach(name => {
      internalCommands.registerCommand(
        name,
        (dvcRoot: string, ...args: Args): Promise<string> =>
          (this[name as keyof CliExecutor] as Function)(dvcRoot, ...args)
      )
    })
  }

  public add(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.ADD, target)
  }

  public checkout(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.CHECKOUT, ...args)
  }

  public commit(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.COMMIT, ...args)
  }

  public experimentApply(cwd: string, experimentName: string) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.APPLY,
      experimentName
    )
  }

  public experimentBranch(
    cwd: string,
    experimentName: string,
    branchName: string
  ) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.BRANCH,
      experimentName,
      branchName
    )
  }

  public experimentGarbageCollect(
    cwd: string,
    preserveFlags: GcPreserveFlag[]
  ) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.GARBAGE_COLLECT,
      Flag.FORCE,
      ExperimentFlag.WORKSPACE,
      ...preserveFlags
    )
  }

  public experimentRemove(cwd: string, experimentName: string) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.REMOVE,
      experimentName
    )
  }

  public experimentRunQueue(cwd: string) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.RUN,
      ExperimentFlag.QUEUE
    )
  }

  public init(cwd: string) {
    return this.executeProcess(cwd, Command.INITIALIZE, Flag.SUBDIRECTORY)
  }

  public pull(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.PULL, ...args)
  }

  public push(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.PUSH, ...args)
  }

  public remove(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.REMOVE, ...args)
  }

  private executeExperimentProcess(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.EXPERIMENT, ...args)
  }
}
