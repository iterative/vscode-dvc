import { join } from 'path'
import { EventEmitter, Event } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { createFileSystemWatcher } from '../fileSystem/watcher'
import { ProcessManager } from '../processManager'
import { InternalCommands } from '../commands/internal'
import { ExperimentsOutput } from '../cli/reader'
import { PlotsOutput } from '../plots/webview/contract'
import { definedAndNonEmpty, sameContents, uniqueValues } from '../util/array'

export abstract class BaseData<T extends PlotsOutput | ExperimentsOutput> {
  public readonly dispose = Disposable.fn()
  public readonly onDidUpdate: Event<T>

  protected readonly dvcRoot: string
  protected readonly processManager: ProcessManager
  protected readonly internalCommands: InternalCommands

  private collectedFiles: string[] = []
  private readonly staticFiles: string[]

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly updated: EventEmitter<T> = this.dispose.track(
    new EventEmitter()
  )

  private readonly collectedFilesChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly onDidChangeCollectedFiles: Event<void> =
    this.collectedFilesChanged.event

  private watcher?: Disposable

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    staticFiles: string[] = []
  ) {
    this.dvcRoot = dvcRoot
    this.processManager = this.dispose.track(
      new ProcessManager(updatesPaused, {
        name: 'update',
        process: () => this.update()
      })
    )
    this.internalCommands = internalCommands
    this.onDidUpdate = this.updated.event
    this.staticFiles = staticFiles

    this.waitForInitialData()
  }

  public isReady() {
    return this.initialized
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  protected compareFiles(files: string[]) {
    if (sameContents(this.collectedFiles, files)) {
      return
    }

    this.collectedFiles = files
    this.collectedFilesChanged.fire()
  }

  protected notifyChanged(data: T) {
    this.updated.fire(data)
  }

  private waitForInitialData() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(() => {
        this.watcher = this.watchFiles()

        this.dispose.track(
          this.onDidChangeCollectedFiles(() => {
            const watcher = this.watchFiles()
            this.dispose.untrack(this.watcher)
            this.watcher?.dispose()
            this.watcher = watcher
          })
        )
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
  }

  private watchFiles() {
    const files = uniqueValues([...this.staticFiles, ...this.collectedFiles])
    if (!definedAndNonEmpty(files)) {
      return
    }

    return this.dispose.track(
      createFileSystemWatcher(
        join(this.dvcRoot, '**', `{${files.join(',')}}`),
        path => {
          if (!path) {
            return
          }
          this.managedUpdate()
        }
      )
    )
  }

  abstract collectFiles(data: T): string[]

  abstract update(): Promise<unknown>
}
