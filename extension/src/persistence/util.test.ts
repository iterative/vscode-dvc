import { commands } from 'vscode'
import { PersistenceKey } from './constants'
import { resetPersistedState } from './util'
import { buildMockMemento } from '../test/util'
import {
  DEFAULT_HEIGHT,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW
} from '../plots/webview/contract'

jest.mock('vscode')

const mockedCommands = jest.mocked(commands)
mockedCommands.executeCommand = jest.fn()

describe('Persistence util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('resetPersistedState', () => {
    it('should reload the window', async () => {
      const workspaceState = buildMockMemento()

      await resetPersistedState(workspaceState)

      expect(mockedCommands.executeCommand).toHaveBeenCalledWith(
        'workbench.action.reloadWindow'
      )
    })

    it('should reset all values from all dvc roots', async () => {
      const persistedState = {
        [PersistenceKey.PLOT_HEIGHT + 'root1']: DEFAULT_HEIGHT,
        [PersistenceKey.PLOT_NB_ITEMS_PER_ROW + 'root2']:
          DEFAULT_SECTION_NB_ITEMS_PER_ROW
      }
      const workspaceState = buildMockMemento(persistedState)

      await resetPersistedState(workspaceState)

      expect(
        workspaceState.get(PersistenceKey.PLOT_HEIGHT + 'root1')
      ).toBeUndefined()
      expect(
        workspaceState.get(PersistenceKey.PLOT_NB_ITEMS_PER_ROW + 'root2')
      ).toBeUndefined()
    })
  })
})
