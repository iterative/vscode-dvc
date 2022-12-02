import { EventEmitter, Event } from 'vscode'
import {
  createFileSystemWatcher,
  getRelativePattern
} from '../fileSystem/watcher'
import { ProcessManager } from '../processManager'
import { InternalCommands } from '../commands/internal'
import { ExperimentsOutput, PlotsOutputOrError } from '../cli/dvc/contract'
import { uniqueValues } from '../util/array'
import { DeferredDisposable } from '../class/deferred'

export abstract class BaseData<
  T extends { data: PlotsOutputOrError; revs: string[] } | ExperimentsOutput
> extends DeferredDisposable {
  public readonly onDidUpdate: Event<T>

  protected readonly dvcRoot: string
  protected readonly processManager: ProcessManager
  protected readonly internalCommands: InternalCommands
  protected collectedFiles: string[] = []

  private readonly staticFiles: string[]

  private readonly updated: EventEmitter<T> = this.dispose.track(
    new EventEmitter()
  )

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    updateProcesses: { name: string; process: () => Promise<unknown> }[],
    staticFiles: string[] = []
  ) {
    super()

    this.dvcRoot = dvcRoot
    this.processManager = this.dispose.track(
      new ProcessManager(updatesPaused, ...updateProcesses)
    )
    this.internalCommands = internalCommands
    this.onDidUpdate = this.updated.event
    this.staticFiles = staticFiles

    this.watchFiles()

    this.waitForInitialData()
  }

  protected notifyChanged(data: T) {
    this.updated.fire(data)
  }

  private waitForInitialData() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(() => {
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
  }

  private getWatchedFiles() {
    return uniqueValues([...this.staticFiles, ...this.collectedFiles])
  }

  private watchFiles() {
    return this.dispose.track(
      createFileSystemWatcher(getRelativePattern(this.dvcRoot, '**'), path => {
        if (
          this.getWatchedFiles().some(watchedRelPath =>
            path.endsWith(watchedRelPath)
          )
        ) {
          this.managedUpdate(path)
        }
      })
    )
  }

  abstract managedUpdate(path?: string): Promise<unknown>

  protected abstract collectFiles(data: T): void
}
