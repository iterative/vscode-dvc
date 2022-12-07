import { EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import { PlotsOutputOrError } from '../../cli/dvc/contract'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { flattenUnique, sameContents } from '../../util/array'
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

    const args = this.getArgs(revs)
    const data = await this.internalCommands.executeCommand<PlotsOutputOrError>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...args
    )

    if (!revs.includes('workspace') && args.length < 2) {
      revs.push('workspace')
    }

    this.notifyChanged({ data, revs })

    this.collectFiles({ data })
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  protected collectFiles({ data }: { data: PlotsOutputOrError }) {
    this.collectedFiles = collectFiles(data, this.collectedFiles)
  }

  private getArgs(revs: string[]) {
    const cliWillThrowError = sameContents(revs, ['workspace'])
    if (this.model && cliWillThrowError) {
      return []
    }

    return revs
  }
}
