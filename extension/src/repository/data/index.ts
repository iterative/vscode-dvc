import { join } from 'path'
import { Event, EventEmitter } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { DataStatusOutput } from '../../cli/reader'
import { DOT_GIT, getGitRepositoryRoot, getHasChanges } from '../../git'
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
import { Flag } from '../../cli/constants'

export type Data = {
  dataStatus: DataStatusOutput
  hasGitChanges: boolean
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
    const dataStatus =
      await this.internalCommands.executeCommand<DataStatusOutput>(
        AvailableCommands.DATA_STATUS,
        this.dvcRoot,
        Flag.UNCHANGED
      )

    const hasGitChanges = await getHasChanges(this.dvcRoot)

    return this.notifyChanged({
      dataStatus,
      hasGitChanges
    })
  }

  private notifyChanged(data: Data) {
    this.updated.fire(data)
  }

  private async watchWorkspace() {
    const gitRoot = await getGitRepositoryRoot(this.dvcRoot)

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
