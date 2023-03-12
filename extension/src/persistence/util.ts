import { commands, Memento } from 'vscode'

export const resetPersistedState = async (workspaceState: Memento) => {
  for (const persistenceKey of workspaceState.keys()) {
    await workspaceState.update(persistenceKey, undefined)
  }

  await commands.executeCommand('workbench.action.reloadWindow')
}
