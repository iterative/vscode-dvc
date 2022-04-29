import { EventEmitter } from 'vscode'
import { PlotsOutput } from '../../cli/reader'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import {
  definedAndNonEmpty,
  flattenUnique,
  sameContents
} from '../../util/array'
import { PlotsModel } from '../model'

export class PlotsData extends BaseData<PlotsOutput> {
  private model?: PlotsModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    super(dvcRoot, internalCommands, updatesPaused, [
      {
        name: 'update',
        process: () => this.update()
      }
    ])
  }

  public async update(): Promise<void> {
    const revisions = flattenUnique([
      this.model?.getMissingRevisions() || [],
      this.model?.getMutableRevisions() || []
    ])

    if (
      (await this.internalCommands.executeCommand<boolean>(
        AvailableCommands.IS_EXPERIMENT_RUNNING
      )) &&
      !definedAndNonEmpty(revisions)
    ) {
      return
    }

    const args = sameContents(revisions, ['workspace']) ? [] : revisions

    const data = await this.internalCommands.executeCommand<PlotsOutput>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...args
    )

    const files = this.collectFiles(data)

    this.compareFiles(files)

    return this.notifyChanged(data)
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public collectFiles(data: PlotsOutput) {
    return Object.keys(data)
  }

  public setModel(model: PlotsModel) {
    this.model = model
  }
}
