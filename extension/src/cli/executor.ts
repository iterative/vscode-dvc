import { Cli, typeCheckCommands } from '.'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommand,
  Flag,
  GcPreserveFlag
} from './constants'
import { setContextValue } from '../vscode/context'

export const autoRegisteredCommands = {
  ADD: 'add',
  CHECKOUT: 'checkout',
  COMMIT: 'commit',
  EXPERIMENT_APPLY: 'experimentApply',
  EXPERIMENT_BRANCH: 'experimentBranch',
  EXPERIMENT_GARBAGE_COLLECT: 'experimentGarbageCollect',
  EXPERIMENT_QUEUE: 'experimentRunQueue',
  EXPERIMENT_REMOVE: 'experimentRemove',
  EXPERIMENT_REMOVE_QUEUE: 'experimentRemoveQueue',
  INIT: 'init',
  IS_SCM_COMMAND_RUNNING: 'isScmCommandRunning',
  MOVE: 'move',
  PULL: 'pull',
  PUSH: 'push',
  REMOVE: 'remove'
} as const

export class CliExecutor extends Cli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  private scmCommandRunning = false

  public add(cwd: string, target: string) {
    return this.blockAndExecuteProcess(cwd, Command.ADD, target)
  }

  public checkout(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.CHECKOUT, ...args)
  }

  public commit(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.COMMIT, ...args)
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
    ...preserveFlags: GcPreserveFlag[]
  ) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.GARBAGE_COLLECT,
      Flag.FORCE,
      ...preserveFlags
    )
  }

  public experimentRemove(cwd: string, ...experimentNames: string[]) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.REMOVE,
      ...experimentNames
    )
  }

  public experimentRemoveQueue(cwd: string) {
    return this.experimentRemove(cwd, ExperimentFlag.QUEUE)
  }

  public experimentRunQueue(cwd: string, ...args: Args) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.RUN,
      ExperimentFlag.QUEUE,
      ...args
    )
  }

  public isScmCommandRunning() {
    return this.scmCommandRunning
  }

  public init(cwd: string) {
    return this.blockAndExecuteProcess(
      cwd,
      Command.INITIALIZE,
      Flag.SUBDIRECTORY
    )
  }

  public move(cwd: string, target: string, destination: string) {
    return this.blockAndExecuteProcess(cwd, Command.MOVE, target, destination)
  }

  public pull(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.PULL, ...args)
  }

  public push(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.PUSH, ...args)
  }

  public remove(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.REMOVE, ...args)
  }

  private executeExperimentProcess(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.EXPERIMENT, ...args)
  }

  private async blockAndExecuteProcess(cwd: string, ...args: Args) {
    this.setRunning(true)
    const output = await this.executeProcess(cwd, ...args)
    this.setRunning(false)
    return output
  }

  private setRunning(running: boolean) {
    this.scmCommandRunning = running
    setContextValue('dvc.scm.command.running', running)
  }
}
