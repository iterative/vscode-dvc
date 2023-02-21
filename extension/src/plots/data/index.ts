import { EventEmitter } from 'vscode'
import { collectMetricsFiles, collectFiles } from './collect'
import {
  EXPERIMENT_WORKSPACE_ID,
  ExperimentsOutput,
  PlotsOutputOrError
} from '../../cli/dvc/contract'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { flattenUnique, sameContents, uniqueValues } from '../../util/array'
import { PlotsModel } from '../model'

export class PlotsData extends BaseData<{
  data: PlotsOutputOrError
  revs: string[]
}> {
  private readonly model: PlotsModel

  private metricFiles: string[] = []

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
      ['dvc.yaml', 'dvc.lock', 'metrics.json']
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

    if (!revs.includes(EXPERIMENT_WORKSPACE_ID) && args.length < 2) {
      revs.push(EXPERIMENT_WORKSPACE_ID)
    }

    this.notifyChanged({ data, revs })

    this.collectFiles({ data })
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public setMetricFiles(data: ExperimentsOutput) {
    const metricsFiles = collectMetricsFiles(data, this.metricFiles)
    if (!sameContents(metricsFiles, this.metricFiles)) {
      this.collectedFiles = uniqueValues([
        ...this.collectedFiles,
        ...metricsFiles
      ])
    }
  }

  protected collectFiles({ data }: { data: PlotsOutputOrError }) {
    this.collectedFiles = collectFiles(data, this.collectedFiles)
  }

  private getArgs(revs: string[]) {
    const cliWillThrowError = sameContents(revs, [EXPERIMENT_WORKSPACE_ID])
    if (this.model && cliWillThrowError) {
      return []
    }

    return revs
  }
}
