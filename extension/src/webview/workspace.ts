import { BaseWebview } from '.'
import { BaseRepository } from './repository'
import { WebviewData } from './contract'
import { InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspace, IWorkspace } from '../workspace'

export abstract class BaseWorkspaceWebviews<
    T extends BaseRepository<U>,
    U extends WebviewData
  >
  extends BaseWorkspace<T>
  implements IWorkspace<T, ResourceLocator>
{
  constructor(
    internalCommands: InternalCommands,
    repositories?: Record<string, T>
  ) {
    super(internalCommands)

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

  public create(dvcRoots: string[], resourceLocator: ResourceLocator): T[] {
    const repositories = dvcRoots.map(dvcRoot =>
      this.createRepository(dvcRoot, resourceLocator)
    )

    Promise.all(repositories.map(repository => repository.isReady())).then(() =>
      this.deferred.resolve()
    )

    return repositories
  }

  public setWebview(dvcRoot: string, webview: BaseWebview<U>) {
    const repository = this.getRepository(dvcRoot)
    if (!repository) {
      webview.dispose()
    }

    repository.setWebview(webview)
  }

  abstract createRepository(
    dvcRoot: string,
    resourceLocator: ResourceLocator
  ): T
}
