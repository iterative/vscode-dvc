import { DvcCli } from '.'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommand,
  Flag,
  GcPreserveFlag,
  QueueSubCommand
} from './constants'
import { typeCheckCommands } from '..'
import { ContextKey, setContextValue } from '../../vscode/context'
import { DEFAULT_REMOTE } from '../git/constants'

export const autoRegisteredCommands = {
  ADD: 'add',
  CHECKOUT: 'checkout',
  COMMIT: 'commit',
  CONFIG: 'config',
  EXP_APPLY: 'expApply',
  EXP_BRANCH: 'expBranch',
  EXP_GARBAGE_COLLECT: 'expGarbageCollect',
  EXP_PUSH: 'expPush',
  EXP_QUEUE: 'expRunQueue',
  EXP_REMOVE: 'expRemove',
  EXP_REMOVE_QUEUE: 'expRemoveQueue',
  INIT: 'init',
  IS_SCM_COMMAND_RUNNING: 'isScmCommandRunning',
  MOVE: 'move',
  PULL: 'pull',
  PUSH: 'push',
  QUEUE_KILL: 'queueKill',
  QUEUE_START: 'queueStart',
  QUEUE_STOP: 'queueStop',
  REMOTE: 'remote',
  REMOVE: 'remove'
} as const

export class DvcExecutor extends DvcCli {
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
    return this.blockAndExecuteProcess(cwd, Command.COMMIT, ...args, Flag.FORCE)
  }

  public config(cwd: string, ...args: Args) {
    return this.executeDvcProcess(cwd, Command.CONFIG, ...args)
  }

  public expApply(cwd: string, experimentName: string) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.APPLY,
      experimentName
    )
  }

  public expBranch(cwd: string, experimentName: string, branchName: string) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.BRANCH,
      experimentName,
      branchName
    )
  }

  public expGarbageCollect(cwd: string, ...preserveFlags: GcPreserveFlag[]) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.GARBAGE_COLLECT,
      Flag.FORCE,
      ...preserveFlags
    )
  }

  public expPush(cwd: string, id: string) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.PUSH,
      DEFAULT_REMOTE,
      id
    )
  }

  public expRemove(cwd: string, ...experimentNames: string[]) {
    return this.executeExperimentProcess(
      cwd,
      ExperimentSubCommand.REMOVE,
      ...experimentNames
    )
  }

  public expRemoveQueue(cwd: string) {
    return this.expRemove(cwd, ExperimentFlag.QUEUE)
  }

  public expRunQueue(cwd: string, ...args: Args) {
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

  public queueKill(cwd: string, ...args: Args) {
    return this.executeDvcProcess(
      cwd,
      Command.QUEUE,
      QueueSubCommand.KILL,
      ...args
    )
  }

  public queueStart(cwd: string, jobs: string) {
    const options = this.getOptions(
      cwd,
      Command.QUEUE,
      QueueSubCommand.START,
      Flag.JOBS,
      jobs
    )

    return this.createBackgroundProcess(options)
  }

  public queueStop(cwd: string, ...args: Args) {
    return this.executeDvcProcess(
      cwd,
      Command.QUEUE,
      QueueSubCommand.STOP,
      ...args
    )
  }

  public remove(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.REMOVE, ...args)
  }

  public remote(cwd: string, ...args: Args) {
    return this.executeDvcProcess(cwd, Command.REMOTE, ...args)
  }

  private executeExperimentProcess(cwd: string, ...args: Args) {
    return this.executeDvcProcess(cwd, Command.EXPERIMENT, ...args)
  }

  private async blockAndExecuteProcess(cwd: string, ...args: Args) {
    this.setRunning(true)
    try {
      const output = await this.executeDvcProcess(cwd, ...args)
      this.setRunning(false)
      return output
    } catch (error) {
      this.setRunning(false)
      throw error
    }
  }

  private setRunning(running: boolean) {
    this.scmCommandRunning = running
    void setContextValue(ContextKey.SCM_RUNNING, running)
  }
}
