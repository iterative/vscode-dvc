import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
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
import { DataStatusOutput } from '../../cli/dvc/reader'

export type Data = {
  dataStatus: DataStatusOutput
  hasGitChanges: boolean
  untracked: Set<string>
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
      new ProcessManager(updatesPaused, {
        name: 'update',
        process: () => this.update()
      })
    )

    this.internalCommands = internalCommands
    this.onDidUpdate = this.updated.event
    this.watchWorkspace()

    this.initialize()
  }

  public async managedUpdate() {
    await this.isReady()
    return this.processManager.run('update')
  }

  private initialize() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(() => {
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
    return this.update()
  }

  private async update() {
    const [dataStatus, hasGitChanges, untracked] = await Promise.all([
      this.internalCommands.executeCommand<DataStatusOutput>(
        AvailableCommands.DATA_STATUS,
        this.dvcRoot
      ),
      this.internalCommands.executeCommand<boolean>(
        AvailableCommands.GIT_HAS_CHANGES,
        this.dvcRoot
      ),
      this.internalCommands.executeCommand<Set<string>>(
        AvailableCommands.GIT_LIST_UNTRACKED,
        this.dvcRoot
      )
    ])

    return this.notifyChanged({
      dataStatus,
      hasGitChanges,
      untracked
    })
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
          return this.managedUpdate()
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
          return this.managedUpdate()
        }
      )
    )
  }
}
