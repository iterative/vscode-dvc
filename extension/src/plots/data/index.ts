import { Event, EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import {
  EXPERIMENT_WORKSPACE_ID,
  PlotsOutputOrError
} from '../../cli/dvc/contract'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { BaseData } from '../../data'
import { sameContents, uniqueValues } from '../../util/array'
import { PlotsModel } from '../model'
import { DVCLIVE_STEP_COMPLETED_SIGNAL_FILE } from '../../cli/dvc/constants'

export class PlotsData extends BaseData<{
  data: PlotsOutputOrError
  revs: string[]
}> {
  public readonly onDidTrigger: Event<void>

  private readonly model: PlotsModel

  private metricFiles: string[] = []

  private readonly triggered: EventEmitter<void> = this.dispose.track(
    new EventEmitter()
  )

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    model: PlotsModel,
    subProjects: string[]
  ) {
    super(
      dvcRoot,
      internalCommands,
      [
        {
          name: 'update',
          process: () => this.update()
        }
      ],
      subProjects,
      ['dvc.yaml', 'dvc.lock', DVCLIVE_STEP_COMPLETED_SIGNAL_FILE]
    )
    this.model = model
    this.onDidTrigger = this.triggered.event
    this.waitForInitialData()
  }

  public async update(): Promise<void> {
    this.notifyTriggered()
    const revs = this.model.getSelectedOrderedIds()

    const args = this.getArgs(revs)
    const data = await this.internalCommands.executeCommand<PlotsOutputOrError>(
      AvailableCommands.PLOTS_DIFF,
      this.dvcRoot,
      ...args
    )

    this.notifyChanged({ data, revs })

    this.collectFiles({ data })
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public setMetricFiles(metricsFiles: string[]) {
    if (!sameContents(metricsFiles, this.metricFiles)) {
      this.metricFiles = metricsFiles
      this.collectedFiles = uniqueValues([
        ...this.collectedFiles,
        ...metricsFiles
      ])
    }
  }

  protected collectFiles({ data }: { data: PlotsOutputOrError }) {
    this.collectedFiles = collectFiles(data, this.collectedFiles)
  }

  private notifyTriggered() {
    this.triggered.fire()
  }

  private getArgs(revs: string[]) {
    const cliWillThrowError = sameContents(revs, [EXPERIMENT_WORKSPACE_ID])
    if (this.model && cliWillThrowError) {
      return []
    }

    return revs
  }
}
