import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ResourceLocator } from '../ResourceLocator'
import { ExperimentsWebview } from './experiments/ExperimentsWebview'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from './experiments/contract'

export class WebviewManager {
  public readonly dispose = Disposable.fn()
  private readonly openedWebviews: {
    experiments?: ExperimentsWebview
  }

  constructor(
    private readonly config: Config,
    private readonly resourceLocator: ResourceLocator
  ) {
    this.openedWebviews = {}
    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (panel: WebviewPanel) => {
          ExperimentsWebview.restore(panel, this.config).then(view => {
            this.addExperiments(view)
          })
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

  public async findOrCreateExperiments(): Promise<ExperimentsWebview> {
    const experiments = this.openedWebviews.experiments
    if (experiments) {
      return experiments.reveal()
    }

    const view = await ExperimentsWebview.create(
      this.config,
      this.resourceLocator
    )
    this.addExperiments(view)
    return view
  }

  public refreshExperiments(tableData: ExperimentsRepoJSONOutput | null): void {
    this.openedWebviews?.experiments?.showExperiments({ tableData })
  }

  private addExperiments(view: ExperimentsWebview) {
    this.openedWebviews.experiments = view
    view.onDidDispose(() => {
      this.openedWebviews.experiments = undefined
    })
  }
}
