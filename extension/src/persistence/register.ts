import { Memento } from 'vscode'
import { resetPersistedState } from './util'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'

export const registerPersistenceCommands = (
  workspaceState: Memento,
  globalState: Memento,
  internalCommands: InternalCommands
) => {
  internalCommands.registerExternalCommand(RegisteredCommands.RESET_STATE, () =>
    resetPersistedState(workspaceState, globalState)
  )
}
