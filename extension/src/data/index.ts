import { relative } from 'path'
import { EventEmitter, Event } from 'vscode'
import { getRelativePattern } from '../fileSystem/relativePattern'
import { createFileSystemWatcher } from '../fileSystem/watcher'
import { ProcessManager } from '../process/manager'
import { InternalCommands } from '../commands/internal'
import { ExpShowOutput, PlotsOutputOrError } from '../cli/dvc/contract'
import { uniqueValues } from '../util/array'
import { DeferredDisposable } from '../class/deferred'
import { isSameOrChild } from '../fileSystem'

export type ExperimentsOutput = {
  availableNbCommits: { [branch: string]: number }
  expShow: ExpShowOutput
  gitLog: string
  rowOrder: { branch: string; sha: string }[]
}

export abstract class BaseData<
  T extends
    | { data: PlotsOutputOrError; revs: string[] }
    | ExperimentsOutput
    | string
> extends DeferredDisposable {
  public readonly onDidUpdate: Event<T>
  public readonly onDidChangeDvcYaml: Event<void>

  protected readonly dvcRoot: string
  protected readonly processManager: ProcessManager
  protected readonly internalCommands: InternalCommands
  protected collectedFiles: string[] = []

  private readonly staticFiles: string[]

  private readonly updated: EventEmitter<T> = this.dispose.track(
    new EventEmitter()
  )

  private readonly dvcYamlChanged: EventEmitter<void> = this.dispose.track(
    new EventEmitter<void>()
  )

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updateProcesses: { name: string; process: () => Promise<unknown> }[],
    staticFiles: string[] = []
  ) {
    super()

    this.dvcRoot = dvcRoot
    this.processManager = this.dispose.track(
      new ProcessManager(...updateProcesses)
    )
    this.internalCommands = internalCommands
    this.onDidUpdate = this.updated.event
    this.staticFiles = staticFiles

    this.onDidChangeDvcYaml = this.dvcYamlChanged.event

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
    return createFileSystemWatcher(
      disposable => this.dispose.track(disposable),
      getRelativePattern(this.dvcRoot, '**'),
      path => {
        const relPath = relative(this.dvcRoot, path)
        if (
          this.getWatchedFiles().some(
            watchedRelPath =>
              path.endsWith(watchedRelPath) ||
              isSameOrChild(relPath, watchedRelPath)
          )
        ) {
          void this.managedUpdate(path)
        }

        if (path.endsWith('dvc.yaml')) {
          this.dvcYamlChanged.fire()
        }
      }
    )
  }

  abstract managedUpdate(path?: string): Promise<unknown>
}
