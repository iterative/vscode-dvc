import { ensureDir } from 'fs-extra'
import { basename, dirname } from 'path'
import { Cli } from '.'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommands,
  Flag,
  GcPreserveFlag
} from './args'
import { ExecutionOptions, CliExecution } from './execution'

const { executeCliProcess } = CliExecution

export class CliExecutor extends Cli {
  private async executeProcessOnTarget(
    fsPath: string,
    ...args: Args
  ): Promise<string> {
    const cwd = dirname(fsPath)

    const target = basename(fsPath)
    await ensureDir(cwd)

    return this.executeProcess(cwd, ...args, target)
  }

  public addTarget = (fsPath: string): Promise<string> =>
    this.executeProcessOnTarget(fsPath, Command.ADD)

  public checkout = (cwd: string): Promise<string> =>
    this.executeProcess(cwd, Command.CHECKOUT, Flag.FORCE)

  public checkoutTarget = (fsPath: string): Promise<string> =>
    this.executeProcessOnTarget(fsPath, Command.CHECKOUT, Flag.FORCE)

  public commit = (cwd: string): Promise<string> =>
    this.executeProcess(cwd, Command.COMMIT, Flag.FORCE)

  public commitTarget = (fsPath: string): Promise<string> =>
    this.executeProcessOnTarget(fsPath, Command.COMMIT, Flag.FORCE)

  public experimentApply = (
    cwd: string,
    experimentName: string
  ): Promise<string> =>
    this.executeProcess(
      cwd,
      Command.EXPERIMENT,
      ExperimentSubCommands.APPLY,
      experimentName
    )

  public experimentBranch = (
    cwd: string,
    experiment: string,
    branchName: string
  ): Promise<string> =>
    this.executeProcess(
      cwd,
      Command.EXPERIMENT,
      ExperimentSubCommands.BRANCH,
      experiment,
      branchName
    )

  public experimentRemove = (
    cwd: string,
    experimentName: string
  ): Promise<string> =>
    this.executeProcess(
      cwd,
      Command.EXPERIMENT,
      ExperimentSubCommands.REMOVE,
      experimentName
    )

  public experimentRunQueue = (cwd: string): Promise<string> =>
    this.executeProcess(
      cwd,
      Command.EXPERIMENT,
      ExperimentSubCommands.RUN,
      ExperimentFlag.QUEUE
    )

  public help(cwd: string): Promise<string> {
    return this.executeProcess(cwd, Flag.HELP)
  }

  public init = (cwd: string): Promise<string> =>
    this.executeProcess(cwd, Command.INITIALIZE, Flag.SUBDIRECTORY)

  public pull = (cwd: string): Promise<string> =>
    this.executeProcess(cwd, Command.PULL)

  public pullTarget = (fsPath: string): Promise<string> =>
    this.executeProcessOnTarget(fsPath, Command.PULL)

  public push = (cwd: string): Promise<string> =>
    this.executeProcess(cwd, Command.PUSH)

  public pushTarget = (fsPath: string): Promise<string> =>
    this.executeProcessOnTarget(fsPath, Command.PUSH)

  public removeTarget = (fsPath: string): Promise<string> =>
    this.executeProcessOnTarget(fsPath, Command.REMOVE)
}

export const experimentGarbageCollect = (
  options: ExecutionOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  executeCliProcess(
    options,
    Command.EXPERIMENT,
    ExperimentSubCommands.GARBAGE_COLLECT,
    Flag.FORCE,
    ExperimentFlag.WORKSPACE,
    ...preserveFlags
  )
