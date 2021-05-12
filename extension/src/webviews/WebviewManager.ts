import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { createHash } from 'crypto'
import { ResourceLocator } from '../ResourceLocator'
import { ExperimentsWebview } from './experiments/ExperimentsWebview'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from './experiments/contract'

export class WebviewManager {
  private openedWebviews: {
    experiments: Record<string, ExperimentsWebview | undefined>
  } = { experiments: {} }

  public readonly dispose = Disposable.fn()

  private lastExperimentsOutputHash: Record<string, string> = {}

  constructor(
    private readonly config: Config,
    private readonly resourceLocator: ResourceLocator
  ) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (panel: WebviewPanel) => {
          const view = await ExperimentsWebview.restore(panel, this.config)
          this.addExperiments(ExperimentsWebview.viewKey, view)
        }
      })
    )

    this.dispose.track({
      dispose: () => {
        Object.values(this.openedWebviews).map(panel => {
          if (panel) {
            Object.values(panel).forEach(view => view?.dispose())
          }
        })
      }
    })
  }

  public findOrCreateExperiments = async (
    dvcRoot: string
  ): Promise<ExperimentsWebview> => {
    const experiments = this.openedWebviews.experiments?.[dvcRoot]
    if (experiments) {
      return experiments.reveal()
    }

    const experimentsWebview = await ExperimentsWebview.create(
      this.config,
      this.resourceLocator
    )
    this.addExperiments(dvcRoot, experimentsWebview)
    return experimentsWebview
  }

  public refreshExperiments = (
    dvcRoot: string,
    tableData: ExperimentsRepoJSONOutput | null
  ): void => {
    const outputHash = createHash('sha1')
      .update(JSON.stringify(tableData))
      .digest('base64')

    if (outputHash !== this.lastExperimentsOutputHash[dvcRoot]) {
      this.lastExperimentsOutputHash[dvcRoot] = outputHash
      this.openedWebviews?.experiments?.[dvcRoot]?.showExperiments({
        tableData
      })
    }
  }

  private addExperiments = (dvcRoot: string, view: ExperimentsWebview) => {
    this.openedWebviews.experiments[dvcRoot] = view
    view.onDidDispose(() => {
      this.resetExperiments(dvcRoot)
    })
  }

  private resetExperiments = (dvcRoot: string) => {
    if (this.openedWebviews?.experiments?.[dvcRoot]) {
      this.openedWebviews.experiments[dvcRoot] = undefined
      this.lastExperimentsOutputHash[dvcRoot] = ''
    }
  }
}
