import { Memento } from 'vscode'
import { BaseWebview } from '.'
import { BaseRepository } from './repository'
import { WebviewData } from './contract'
import { InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspace } from '../workspace'

export abstract class BaseWorkspaceWebviews<
  T extends BaseRepository<U>,
  U extends WebviewData
> extends BaseWorkspace<T, ResourceLocator> {
  protected readonly workspaceState: Memento

  constructor(
    internalCommands: InternalCommands,
    workspaceState: Memento,
    repositories?: Record<string, T>
  ) {
    super(internalCommands)

    this.workspaceState = workspaceState

    if (repositories) {
      this.repositories = repositories
    }
  }

  public async showWebview() {
    const dvcRoot = await this.getOnlyOrPickProject()
    if (!dvcRoot) {
      return
    }

    const repository = this.getRepository(dvcRoot)
    await repository.showWebview()
    return repository
  }

  public setWebview(dvcRoot: string, webview: BaseWebview<U>) {
    const repository = this.getRepository(dvcRoot)
    if (!repository) {
      webview.dispose()
    }

    repository.setWebview(webview)
  }
}
