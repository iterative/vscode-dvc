import { Memento } from 'vscode'
import { PersistenceKey } from './constants'
import { DeferredDisposable } from '../class/deferred'

export class ModelWithPersistence extends DeferredDisposable {
  protected readonly dvcRoot: string
  private readonly workspaceState: Memento

  constructor(dvcRoot: string, workspaceState: Memento) {
    super()

    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
  }

  protected persist(key: PersistenceKey, value: unknown) {
    this.workspaceState.update(key + this.dvcRoot, value)
  }

  protected revive<T>(key: PersistenceKey, defaultValue: T) {
    return this.workspaceState.get<T>(key + this.dvcRoot, defaultValue)
  }
}
