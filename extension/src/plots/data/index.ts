import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { Event, EventEmitter } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { PlotsOutput } from '../../plots/webview/contract'
import { ProcessManager } from '../../processManager'
import { sameContents } from '../../util/array'

export class PlotsData {
  public readonly dispose = Disposable.fn()
  public readonly onDidUpdate: Event<PlotsOutput>

  protected readonly dvcRoot: string
  protected readonly processManager: ProcessManager

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly internalCommands: InternalCommands

  private readonly updated: EventEmitter<PlotsOutput> = this.dispose.track(
    new EventEmitter()
  )

  private revisions?: string[]

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
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

    this.initialize()
  }

  public isReady() {
    return this.initialized
  }

  public setRevisions(...revisions: string[]) {
    if (this.revisions && sameContents(revisions, this.revisions)) {
      return
    }

    this.revisions = revisions
    this.managedUpdate()
  }

  public managedUpdate() {
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
  }

  private async update(): Promise<void> {
    const data = await this.internalCommands.executeCommand<PlotsOutput>(
      AvailableCommands.PLOTS_SHOW,
      this.dvcRoot,
      ...(this.revisions || [])
    )

    return this.notifyChanged(data)
  }

  private notifyChanged(data: PlotsOutput) {
    this.updated.fire(data)
  }
}
