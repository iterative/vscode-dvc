import { join } from 'path'
import { EventEmitter, Event } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { createFileSystemWatcher } from '../fileSystem/watcher'
import { ProcessManager } from '../processManager'
import { InternalCommands } from '../commands/internal'
import { ExperimentsOutput, PlotsOutput } from '../cli/reader'
import { definedAndNonEmpty, sameContents, uniqueValues } from '../util/array'
import { DeferredDisposable } from '../class/deferred'

export abstract class BaseData<
  T extends { data: PlotsOutput; revs: string[] } | ExperimentsOutput
> extends DeferredDisposable {
  public readonly onDidUpdate: Event<T>

  protected readonly dvcRoot: string
  protected readonly processManager: ProcessManager
  protected readonly internalCommands: InternalCommands

  private collectedFiles: string[] = []
  private readonly staticFiles: string[]

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

    this.waitForInitialData()
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
          this.managedUpdate(path)
        }
      )
    )
  }

  abstract collectFiles(data: T): string[]

  abstract managedUpdate(path?: string): Promise<unknown>
}
