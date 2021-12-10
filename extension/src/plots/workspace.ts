import { EventEmitter } from 'vscode'
import { Plots } from '.'
import { PlotsData } from './webview/contract'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspaceWebviews } from '../webview/workspace'

export class WorkspacePlots extends BaseWorkspaceWebviews<Plots, PlotsData> {
  public createRepository(
    dvcRoot: string,
    updatesPaused: EventEmitter<boolean>,
    resourceLocator: ResourceLocator
  ) {
    const plots = this.dispose.track(
      new Plots(
        dvcRoot,
        this.internalCommands,
        updatesPaused,
        resourceLocator.scatterGraph,
        this.workspaceState
      )
    )

    this.setRepository(dvcRoot, plots)

    return plots
  }
}
