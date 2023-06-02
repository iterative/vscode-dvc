import { commands, Memento } from 'vscode'

export const resetPersistedState = async (
  workspaceState: Memento,
  globalState: Memento
) => {
  for (const persistenceKey of workspaceState.keys()) {
    await workspaceState.update(persistenceKey, undefined)
  }
  for (const persistenceKey of globalState.keys()) {
    await globalState.update(persistenceKey, undefined)
  }

  await commands.executeCommand('workbench.action.reloadWindow')
}
