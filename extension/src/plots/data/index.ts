import { EventEmitter } from 'vscode'
import { PlotsOutputOrError } from '../../cli/dvc/contract'
import { isDvcError } from '../../cli/dvc/reader'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import {
  definedAndNonEmpty,
  flattenUnique,
  sameContents
} from '../../util/array'
import { PlotsModel } from '../model'

export class PlotsData extends BaseData<{
  data: PlotsOutputOrError
  revs: string[]
}> {
  private readonly model: PlotsModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    model: PlotsModel,
    updatesPaused: EventEmitter<boolean>
  ) {
    super(
      dvcRoot,
      internalCommands,
      updatesPaused,
      [
        {
          name: 'update',
          process: () => this.update()
        }
      ],
      ['dvc.yaml', 'dvc.lock']
    )
    this.model = model
  }

  public async update(): Promise<void> {
    const revs = flattenUnique([
      this.model.getMissingRevisions(),
      this.model.getMutableRevisions()
    ])

    if (
      (await this.internalCommands.executeCommand<boolean>(
        AvailableCommands.IS_EXPERIMENT_RUNNING
      )) &&
      !definedAndNonEmpty(revs)
    ) {
      return
    }

    const args = this.getArgs(revs)
    const data = await this.internalCommands.executeCommand<PlotsOutputOrError>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...args
    )

    const files = this.collectFiles({ data })

    this.compareFiles(files)

    return this.notifyChanged({ data, revs })
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public collectFiles({ data }: { data: PlotsOutputOrError }) {
    if (isDvcError(data)) {
      return this.collectedFiles
    }
    return [...Object.keys(data), ...this.collectedFiles]
  }

  private getArgs(revs: string[]) {
    const cliWillThrowError = sameContents(revs, ['workspace'])
    if (this.model && cliWillThrowError) {
      return []
    }

    return revs
  }
}
