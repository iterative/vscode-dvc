import { EventEmitter } from 'vscode'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { PlotsOutput } from '../../plots/webview/contract'
import { sameContents } from '../../util/array'

export class PlotsData extends BaseData<PlotsOutput> {
  private revisions?: string[]

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    super(dvcRoot, internalCommands, updatesPaused)

    this.initialize()
  }

  public clearRevisions() {
    this.revisions = undefined
  }

  public setRevisions(...revisions: string[]) {
    if (this.revisions && sameContents(revisions, this.revisions)) {
      return
    }

    this.revisions = revisions
    this.managedUpdate()
  }

  public async update(): Promise<void> {
    const data = await this.internalCommands.executeCommand<PlotsOutput>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...(this.revisions || [])
    )

    return this.notifyChanged(data)
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
}
