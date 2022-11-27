import { EventEmitter } from 'vscode'
import { PlotsOutput } from '../../cli/dvc/contract'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { Experiments } from '../../experiments'
import {
  definedAndNonEmpty,
  flattenUnique,
  sameContents
} from '../../util/array'
import { PlotsModel } from '../model'

export class PlotsData extends BaseData<{ data: PlotsOutput; revs: string[] }> {
  private readonly plots: PlotsModel
  private readonly experiments: Experiments

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    plots: PlotsModel,
    experiments: Experiments,
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

    this.plots = plots
    this.experiments = experiments
  }

  public async update(): Promise<void> {
    const revs = flattenUnique([
      this.plots.getMissingRevisions(this.experiments.getSelectedRevisions()),
      this.experiments.getMutableRevisions()
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
    const data = await this.fetch(args)

    const files = this.collectFiles({ data })

    this.compareFiles(files)

    this.notifyChanged({ data, revs })
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public collectFiles({ data }: { data: PlotsOutput }) {
    return Object.keys(data)
  }

  public fetch(revs: string[]) {
    return this.internalCommands.executeCommand<PlotsOutput>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...revs
    )
  }

  private getArgs(revs: string[]) {
    const cliWillThrowError = sameContents(revs, ['workspace'])
    if (this.plots && cliWillThrowError) {
      return []
    }

    return revs
  }
}
