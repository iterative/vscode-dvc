import { Memento } from 'vscode'
import { PersistenceKey } from './constant'

export class ModelWithPersistence {
  private readonly dvcRoot: string
  private readonly workspaceState: Memento

  constructor(dvcRoot: string, workspaceState: Memento) {
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
