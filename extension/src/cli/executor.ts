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
import { bindMethods } from '../util/bind'

export class CliExecutor extends Cli {
  private executeExperimentProcess(cwd: string, ...args: Args) {
    return this.executeProcess(cwd, Command.EXPERIMENT, ...args)
  }

  private executeForcedProcess(cwd: string, command: Command, ...args: Args) {
    return this.executeProcess(cwd, command, Flag.FORCE, ...args)
  }

  public addTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.ADD, target)
  }

  public checkout(cwd: string) {
    return this.executeProcess(cwd, Command.CHECKOUT)
  }

  public checkoutTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.CHECKOUT, target)
  }

  public commit(cwd: string) {
    return this.executeProcess(cwd, Command.COMMIT)
  }

  public commitTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.COMMIT, target)
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

  public forceCheckout(cwd: string) {
    return this.executeForcedProcess(cwd, Command.CHECKOUT)
  }

  public forceCheckoutTarget(cwd: string, target: string) {
    return this.executeForcedProcess(cwd, Command.CHECKOUT, target)
  }

  public forceCommit(cwd: string) {
    return this.executeForcedProcess(cwd, Command.COMMIT)
  }

  public forceCommitTarget(cwd: string, target: string) {
    return this.executeForcedProcess(cwd, Command.COMMIT, target)
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

  public pullTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.PULL, target)
  }

  public push(cwd: string) {
    return this.executeProcess(cwd, Command.PUSH)
  }

  public pushTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.PUSH, target)
  }

  public removeTarget(cwd: string, target: string) {
    return this.executeProcess(cwd, Command.REMOVE, target)
  }

  constructor(
    config: Config,
    emitters?: {
      processStarted: EventEmitter<void>
      processCompleted: EventEmitter<CliResult>
    }
  ) {
    super(config, emitters)

    bindMethods<CliExecutor>(
      this,
      'addTarget',
      'checkout',
      'checkoutTarget',
      'commit',
      'commitTarget',
      'forceCheckout',
      'forceCheckoutTarget',
      'forceCommit',
      'forceCommitTarget',
      'forcePull',
      'forcePush',
      'pull',
      'push'
    )
  }
}
