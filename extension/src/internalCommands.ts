import { Disposable } from '@hediet/std/disposable'
import { Args } from './cli/args'
import { CliExecutor } from './cli/executor'
import { CliReader } from './cli/reader'
import { Config } from './config'
import { pickExperimentName } from './experiments/quickPick'
import { quickPickOne } from './vscode/quickPick'

type Command = (...args: Args) => unknown | Promise<unknown>

export enum AvailableCommands {
  ADD = 'add', // scm
  CHECKOUT = 'checkout', // scm & explorer
  COMMIT = 'commit', // scm & explorer
  DIFF = 'diff', // scm & decoration
  EXPERIMENT_LIST_CURRENT = 'experimentListCurrent', // experiments
  EXPERIMENT_SHOW = 'experimentShow', // experiments
  INIT = 'init', // explorer welcome
  LIST_DVC_ONLY = 'listDvcOnly', // explorer
  LIST_DVC_ONLY_RECURSIVE = 'listDvcOnlyRecursive', // scm & decoration
  PULL = 'pull', // scm & explorer
  PUSH = 'push', // scm & explorer
  REMOVE = 'remove', // explorer
  STATUS = 'status', // scm & decoration

  EXPERIMENT_APPLY = 'experimentApply', // experiments
  EXPERIMENT_RUN_QUEUE = 'experimentRunQueue', // experiments
  EXPERIMENT_REMOVE = 'experimentRemove', // experiments
  PICK_EXPERIMENT_NAME = 'pickExperimentName', // experiments
  QUICK_PICK_ONE_PROJECT = 'quickPickOneProject', // experiments
  GET_DEFAULT_PROJECT = 'getDefaultProject', // experiments
  GET_DEFAULT_OR_PICK_PROJECT = 'getDefaultOrPickProject' // experiments
}

export class InternalCommands {
  public dispose = Disposable.fn()

  private readonly commands = new Map<string, Command>()

  constructor(config: Config, cliExecutor: CliExecutor, cliReader: CliReader) {
    this.registerCommands(cliExecutor)
    this.registerCommands(cliReader)

    this.registerCommand(
      AvailableCommands.PICK_EXPERIMENT_NAME,
      (cwd: string) =>
        pickExperimentName(
          this.executeCommand(AvailableCommands.EXPERIMENT_LIST_CURRENT, cwd)
        )
    )

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

  private registerCommands(cli: CliExecutor | CliReader) {
    cli.commandsToRegister.forEach((name: string) => {
      this.registerCommand(
        name,
        (dvcRoot: string, ...args: Args): Promise<string> =>
          (cli[name as keyof typeof cli] as Function)(dvcRoot, ...args)
      )
    })
  }
}
