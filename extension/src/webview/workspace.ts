import { Memento } from 'vscode'
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

  protected focusedWebviewDvcRoot: string | undefined

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

  public getFocusedWebview(): T | undefined {
    if (!this.focusedWebviewDvcRoot) {
      return undefined
    }
    return this.getRepository(this.focusedWebviewDvcRoot)
  }

  protected async getDvcRoot(overrideRoot?: string) {
    return overrideRoot || (await this.getFocusedOrOnlyOrPickProject())
  }

  abstract getFocusedOrOnlyOrPickProject(): string | Promise<string | undefined>
}
