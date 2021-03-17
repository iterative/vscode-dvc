import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ResourceLocator } from './ResourceLocator'
import { DvcExperimentsWebview } from './DvcExperimentsWebview'
import { Config } from './Config'
import { ExperimentsRepoJSONOutput } from './webviews/experiments/contract'

export class DvcWebviewManager {
  public readonly dispose = Disposable.fn()
  private readonly openedWebviews: {
    experiments?: DvcExperimentsWebview
  }

  constructor(
    private readonly config: Config,
    private readonly resourceLocator: ResourceLocator
  ) {
    this.openedWebviews = {}
    this.dispose.track(
      window.registerWebviewPanelSerializer(DvcExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (panel: WebviewPanel) => {
          DvcExperimentsWebview.restore(panel, this.config).then(view => {
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

  public async findOrCreateExperiments(): Promise<DvcExperimentsWebview> {
    const experiments = this.openedWebviews.experiments
    if (experiments) {
      return experiments.reveal()
    }

    const view = await DvcExperimentsWebview.create(
      this.config,
      this.resourceLocator
    )
    this.addExperiments(view)
    return view
  }

  public refreshExperiments(tableData: ExperimentsRepoJSONOutput | null): void {
    this.openedWebviews?.experiments?.showExperiments({ tableData })
  }

  private addExperiments(view: DvcExperimentsWebview) {
    this.openedWebviews.experiments = view
    view.onDidDispose(() => {
      this.openedWebviews.experiments = undefined
    })
  }
}
