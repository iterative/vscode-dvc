import { Cli } from '.'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommand,
  Flag,
  GcPreserveFlag
} from './args'

export class CliExecutor extends Cli {
  public addTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.ADD, target)
  }

  public checkout(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.CHECKOUT, ...args)
  }

  public checkoutTarget(cwd: string, target: string, ...args: Args) {
    return this.executeProcess(cwd, Command.CHECKOUT, target, ...args)
  }

  public commit(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.COMMIT, ...args)
  }

  public commitTarget(cwd: string, target: string, ...args: Args) {
    return this.executeProcess(cwd, Command.COMMIT, target, ...args)
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

  public forcePull(cwd: string) {
    return this.executeForcedProcess(cwd, Command.PULL)
  }

  public forcePush(cwd: string) {
    return this.executeForcedProcess(cwd, Command.PUSH)
  }

  public init(cwd: string) {
    return this.executeProcess(cwd, Command.INITIALIZE, Flag.SUBDIRECTORY)
  }

  public pull(cwd: string) {
    return this.executeProcess(cwd, Command.PULL)
  }

  public pullTarget(cwd: string, target: string, ...args: Args) {
    return this.executeProcess(cwd, Command.PULL, target, ...args)
  }

  public push(cwd: string) {
    return this.executeProcess(cwd, Command.PUSH)
  }

  public pushTarget(cwd: string, target: string, ...args: Args) {
    return this.executeProcess(cwd, Command.PUSH, target, ...args)
  }

  public removeTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.REMOVE, target)
  }

  private executeExperimentProcess(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.EXPERIMENT, ...args)
  }

  private executeForcedProcess(cwd: string, command: Command, ...args: Args) {
    return this.executeProcess(cwd, command, Flag.FORCE, ...args)
  }
}
