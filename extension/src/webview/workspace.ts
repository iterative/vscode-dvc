import { Memento, ViewColumn } from 'vscode'
import { BaseRepository } from './repository'
import { WebviewData } from './contract'
import { createWebview } from './factory'
import { ViewKey } from './constants'
import { InternalCommands } from '../commands/internal'
import { BaseWorkspace } from '../workspace'
import { ResourceLocator } from '../resourceLocator'

export abstract class BaseWorkspaceWebviews<
  T extends BaseRepository<U>,
  U extends WebviewData
> extends BaseWorkspace<T, unknown> {
  protected readonly workspaceState: Memento

  protected focusedWebviewDvcRoot: string | undefined

  private resourceLocator: ResourceLocator
  private noDvc: boolean

  constructor(
    internalCommands: InternalCommands,
    workspaceState: Memento,
    resourceLocator: ResourceLocator,
    noDvc: boolean,
    repositories?: Record<string, T>
  ) {
    super(internalCommands)

    this.workspaceState = workspaceState

    this.resourceLocator = resourceLocator

    this.noDvc = noDvc

    if (repositories) {
      this.repositories = repositories
    }
  }

  public async showWebview(overrideRoot: string, viewColumn?: ViewColumn) {
    if (this.noDvc) {
      this.showEmptyWebview(viewColumn)
      return
    }

    const dvcRoot = overrideRoot || (await this.getOnlyOrPickProject())

    if (!dvcRoot) {
      return
    }

    const repository = this.getRepository(dvcRoot)
    await repository.showWebview(viewColumn)
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

  protected async showEmptyWebview(viewColumn?: ViewColumn) {
    await createWebview(
      ViewKey.GET_STARTED,
      '',
      this.resourceLocator.dvcIcon,
      viewColumn,
      true
    )
  }

  abstract getFocusedOrOnlyOrPickProject(): string | Promise<string | undefined>
}
