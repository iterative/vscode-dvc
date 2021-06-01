import { basename, dirname } from 'path'
import { ensureDir } from 'fs-extra'
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
  private async executeProcessOnTarget(
    fsPath: string,
    ...args: Args
  ): Promise<string> {
    const cwd = dirname(fsPath)

    const target = basename(fsPath)
    await ensureDir(cwd)

    return this.executeProcess(cwd, ...args, target)
  }

  private executeExperimentProcess = (cwd: string, ...args: Args) =>
    this.executeProcess(cwd, Command.EXPERIMENT, ...args)

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
    this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.APPLY,
      experimentName
    )

  public experimentBranch = (
    cwd: string,
    experimentName: string,
    branchName: string
  ): Promise<string> =>
    this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.BRANCH,
      experimentName,
      branchName
    )

  public experimentGarbageCollect = (
    cwd: string,
    preserveFlags: GcPreserveFlag[]
  ): Promise<string> =>
    this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.GARBAGE_COLLECT,
      Flag.FORCE,
      ExperimentFlag.WORKSPACE,
      ...preserveFlags
    )

  public experimentRemove = (
    cwd: string,
    experimentName: string
  ): Promise<string> =>
    this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.REMOVE,
      experimentName
    )

  public experimentRunQueue = (cwd: string): Promise<string> =>
    this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.RUN,
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
