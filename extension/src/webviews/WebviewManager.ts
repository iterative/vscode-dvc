import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { createHash } from 'crypto'
import { ResourceLocator } from '../ResourceLocator'
import { ExperimentsWebview } from './experiments/ExperimentsWebview'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from './experiments/contract'

export class WebviewManager {
  private readonly openedWebviews: {
    experiments?: ExperimentsWebview
  }

  public readonly dispose = Disposable.fn()

  private lastExperimentsOutputHash = ''

  constructor(
    private readonly config: Config,
    private readonly resourceLocator: ResourceLocator
  ) {
    this.openedWebviews = {}
    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (panel: WebviewPanel) => {
          const view = await ExperimentsWebview.restore(panel, this.config)
          this.addExperiments(view)
        }
      })
    )

    this.dispose.track({
      dispose: () => {
        Object.values(this.openedWebviews).map(panel => {
          panel?.dispose()
        })
      }
    })
  }

  public findOrCreateExperiments = async (): Promise<ExperimentsWebview> => {
    const experiments = this.openedWebviews.experiments
    if (experiments) {
      return experiments.reveal()
    }

    const experimentsWebview = await ExperimentsWebview.create(
      this.config,
      this.resourceLocator
    )
    this.addExperiments(experimentsWebview)
    return experimentsWebview
  }

  public refreshExperiments = (
    tableData: ExperimentsRepoJSONOutput | null
  ): void => {
    const outputHash = createHash('sha1')
      .update(JSON.stringify(tableData))
      .digest('base64')

    if (outputHash !== this.lastExperimentsOutputHash) {
      this.lastExperimentsOutputHash = outputHash
      this.openedWebviews?.experiments?.showExperiments({
        tableData
      })
    }
  }

  private addExperiments = (view: ExperimentsWebview) => {
    this.openedWebviews.experiments = view
    view.onDidDispose(() => {
      this.resetExperiments()
    })
  }

  private resetExperiments = () => {
    this.openedWebviews.experiments = undefined
    this.lastExperimentsOutputHash = ''
  }
}
