import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { DiffOutput, ListOutput, StatusOutput } from '../../cli/dvc/reader'
import { isAnyDvcYaml } from '../../fileSystem'
import { ProcessManager } from '../../processManager'
import {
  createFileSystemWatcher,
  ignoredDotDirectories,
  getRelativePattern
} from '../../fileSystem/watcher'
import {
  EXPERIMENTS_GIT_LOGS_REFS,
  EXPERIMENTS_GIT_REFS
} from '../../experiments/data/constants'
import { DeferredDisposable } from '../../class/deferred'
import { DOT_GIT } from '../../cli/git/constants'

export type Data = {
  diffFromHead: DiffOutput
  diffFromCache: StatusOutput
  untracked: Set<string>
  hasGitChanges: boolean
  tracked?: ListOutput[]
}

export const isExcluded = (dvcRoot: string, path: string) =>
  !path ||
  !(
    path.includes(dvcRoot) ||
    (path.includes('.git') && (path.includes('HEAD') || path.includes('index')))
  ) ||
  path.includes(EXPERIMENTS_GIT_REFS) ||
  path.includes(EXPERIMENTS_GIT_LOGS_REFS) ||
  ignoredDotDirectories.test(path)

export class RepositoryData extends DeferredDisposable {
  public readonly onDidUpdate: Event<Data>

  private readonly dvcRoot: string

  private readonly processManager: ProcessManager
  private readonly internalCommands: InternalCommands

  private readonly updated: EventEmitter<Data> = this.dispose.track(
    new EventEmitter()
  )

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    super()

    this.dvcRoot = dvcRoot
    this.processManager = this.dispose.track(
      new ProcessManager(
        updatesPaused,
        { name: 'partialUpdate', process: () => this.partialUpdate() },
        { name: 'fullUpdate', process: () => this.fullUpdate() }
      )
    )

    this.internalCommands = internalCommands
    this.onDidUpdate = this.updated.event
    this.watchWorkspace()

    this.initialize()
  }

  public async managedUpdate(path?: string) {
    await this.isReady()
    if (
      isAnyDvcYaml(path) ||
      this.processManager.isOngoingOrQueued('fullUpdate')
    ) {
      return this.processManager.run('fullUpdate')
    }

    return this.processManager.run('partialUpdate')
  }

  private initialize() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(() => {
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
    return this.fullUpdate()
  }

  private async fullUpdate() {
    const tracked = await this.internalCommands.executeCommand<ListOutput[]>(
      AvailableCommands.LIST_DVC_ONLY_RECURSIVE,
      this.dvcRoot
    )

    const { diffFromHead, diffFromCache, hasGitChanges, untracked } =
      await this.getPartialUpdateData()

    return this.notifyChanged({
      diffFromCache,
      diffFromHead,
      hasGitChanges,
      tracked,
      untracked
    })
  }

  private async partialUpdate() {
    const { diffFromHead, diffFromCache, untracked, hasGitChanges } =
      await this.getPartialUpdateData()
    return this.notifyChanged({
      diffFromCache,
      diffFromHead,
      hasGitChanges,
      untracked
    })
  }

  private async getPartialUpdateData() {
    const diffFromCache =
      await this.internalCommands.executeCommand<StatusOutput>(
        AvailableCommands.STATUS,
        this.dvcRoot
      )

    const diffFromHead = await this.internalCommands.executeCommand<DiffOutput>(
      AvailableCommands.DIFF,
      this.dvcRoot
    )

    const [untracked, hasGitChanges] = await Promise.all([
      this.internalCommands.executeCommand<Set<string>>(
        AvailableCommands.GIT_LIST_UNTRACKED,
        this.dvcRoot
      ),
      this.internalCommands.executeCommand<boolean>(
        AvailableCommands.GIT_HAS_CHANGES,
        this.dvcRoot
      )
    ])

    return { diffFromCache, diffFromHead, hasGitChanges, untracked }
  }

  private notifyChanged(data: Data) {
    this.updated.fire(data)
  }

  private async watchWorkspace() {
    const gitRoot = await this.internalCommands.executeCommand(
      AvailableCommands.GIT_GET_REPOSITORY_ROOT,
      this.dvcRoot
    )

    this.dispose.track(
      createFileSystemWatcher(
        getRelativePattern(this.dvcRoot, '**'),
        (path: string) => {
          if (isExcluded(this.dvcRoot, path)) {
            return
          }
          return this.managedUpdate(path)
        }
      )
    )

    this.dispose.track(
      createFileSystemWatcher(
        getRelativePattern(join(gitRoot, DOT_GIT), '{HEAD,index}'),
        (path: string) => {
          if (!path) {
            return
          }
          return this.managedUpdate(path)
        }
      )
    )
  }
}
