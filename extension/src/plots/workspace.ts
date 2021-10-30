import { Plots } from '.'
import { PlotsData } from './webview/contract'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspaceWebviews } from '../webview/workspace'

export class WorkspacePlots extends BaseWorkspaceWebviews<Plots, PlotsData> {
  public createRepository(dvcRoot: string, resourceLocator: ResourceLocator) {
    const plots = this.dispose.track(
      new Plots(dvcRoot, this.internalCommands, resourceLocator)
    )

    this.setRepository(dvcRoot, plots)

    return plots
  }
}
