import { EventEmitter } from 'vscode'
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
import { addStudioAccessToken } from './options'
import { CliResult, CliStarted, typeCheckCommands } from '..'
import { ContextKey, setContextValue } from '../../vscode/context'
import { Config } from '../../config'

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
  QUEUE_KILL: 'queueKill',
  QUEUE_START: 'queueStart',
  QUEUE_STOP: 'queueStop',
  REMOVE: 'remove'
} as const

export class DvcExecutor extends DvcCli {
  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  private readonly getStudioLiveShareToken: () => string | undefined
  private readonly getRepoUrl: (cwd: string) => Promise<string>
  private scmCommandRunning = false

  constructor(
    config: Config,
    getStudioLiveShareToken: () => string | undefined,
    getRepoUrl: (cwd: string) => Promise<string>,
    emitters?: {
      processStarted: EventEmitter<CliStarted>
      processCompleted: EventEmitter<CliResult>
    }
  ) {
    super(config, emitters)
    this.getStudioLiveShareToken = getStudioLiveShareToken
    this.getRepoUrl = getRepoUrl
  }

  public add(cwd: string, target: string) {
    return this.blockAndExecuteProcess(cwd, Command.ADD, target)
  }

  public checkout(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.CHECKOUT, ...args)
  }

  public commit(cwd: string, ...args: Args) {
    return this.blockAndExecuteProcess(cwd, Command.COMMIT, ...args, Flag.FORCE)
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

  public queueKill(cwd: string, ...args: Args) {
    return this.executeDvcProcess(
      cwd,
      Command.QUEUE,
      QueueSubCommand.KILL,
      ...args
    )
  }

  public async queueStart(cwd: string, jobs: string) {
    const options = this.getOptions(
      cwd,
      Command.QUEUE,
      QueueSubCommand.START,
      Flag.JOBS,
      jobs
    )
    const studioAccessToken = this.getStudioLiveShareToken()
    const repoUrl = studioAccessToken ? await this.getRepoUrl(cwd) : undefined

    return this.createBackgroundProcess(
      addStudioAccessToken(options, studioAccessToken, repoUrl)
    )
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

  private executeExperimentProcess(cwd: string, ...args: Args) {
    return this.executeDvcProcess(cwd, Command.EXPERIMENT, ...args)
  }

  private async blockAndExecuteProcess(cwd: string, ...args: Args) {
    this.setRunning(true)
    const output = await this.executeDvcProcess(cwd, ...args)
    this.setRunning(false)
    return output
  }

  private setRunning(running: boolean) {
    this.scmCommandRunning = running
    void setContextValue(ContextKey.SCM_RUNNING, running)
  }
}
