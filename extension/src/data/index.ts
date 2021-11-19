import { join } from 'path'
import { EventEmitter, Event } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { createFileSystemWatcher } from '../fileSystem/watcher'
import { ProcessManager } from '../processManager'
import { CommandId, InternalCommands } from '../commands/internal'
import { ExperimentsOutput, PlotsOutput } from '../cli/reader'
import { definedAndNonEmpty, sameContents, uniqueValues } from '../util/array'

export abstract class BaseData<T extends PlotsOutput | ExperimentsOutput> {
  public readonly dispose = Disposable.fn()
  public readonly onDidUpdate: Event<T>

  protected readonly dvcRoot: string

  private collectedFiles: string[] = []
  private readonly staticFiles: string[]

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly processManager: ProcessManager
  private readonly internalCommands: InternalCommands

  private readonly updated: EventEmitter<T> = this.dispose.track(
    new EventEmitter()
  )

  private readonly collectedFilesChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly onDidChangeCollectedFiles: Event<void> =
    this.collectedFilesChanged.event

  private watcher?: Disposable

  private updateCommandId: CommandId

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updateCommandId: CommandId,
    staticFiles: string[] = []
  ) {
    this.dvcRoot = dvcRoot
    this.processManager = this.dispose.track(
      new ProcessManager({
        name: 'update',
        process: () => this.updateData()
      })
    )

    this.internalCommands = internalCommands
    this.updateCommandId = updateCommandId
    this.onDidUpdate = this.updated.event
    this.staticFiles = staticFiles

    this.initialize()
  }

  public isReady() {
    return this.initialized
  }

  public update() {
    return this.processManager.run('update')
  }

  private initialize() {
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
    this.update()
  }

  private async updateData(): Promise<void> {
    const data = await this.internalCommands.executeCommand<T>(
      this.updateCommandId,
      this.dvcRoot
    )

    const files = this.collectFiles(data)

    this.compareFiles(files)

    return this.notifyChanged(data)
  }

  private compareFiles(files: string[]) {
    if (sameContents(this.collectedFiles, files)) {
      return
    }

    this.collectedFiles = files
    this.collectedFilesChanged.fire()
  }

  private notifyChanged(data: T) {
    this.updated.fire(data)
  }

  private watchFiles() {
    const files = uniqueValues([...this.staticFiles, ...this.collectedFiles])
    if (!definedAndNonEmpty(files)) {
      return
    }

    return this.dispose.track(
      createFileSystemWatcher(
        join(this.dvcRoot, '**', `{${files.join(',')}}`),
        () => this.update()
      )
    )
  }

  abstract collectFiles(data: T): string[]
}
