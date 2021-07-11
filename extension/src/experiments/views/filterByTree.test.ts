import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, window } from 'vscode'
import { ExperimentsFilterByTree } from './filterByTree'
import { Experiments } from '..'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedTreeDataChanged = mocked(new EventEmitter<string | void>())
const mockedTreeDataChangedFire = jest.fn()
mockedTreeDataChanged.fire = mockedTreeDataChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()

const mockedDisposable = mocked(Disposable)

const mockedGetFilteredBy = jest.fn()
const mockedExperiments = {
  getFilteredBy: mockedGetFilteredBy,
  isReady: () => true
} as unknown as Experiments

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValue({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('ExperimentsFilterByTree', () => {
  describe('getChildren', () => {
    it('(placeholder) should return an empty array', async () => {
      const experimentsSortByTree = new ExperimentsFilterByTree(
        mockedExperiments
      )
      mockedGetFilteredBy.mockReturnValue([])
      const rootElements = await experimentsSortByTree.getChildren()
      expect(rootElements).toEqual([])
    })
  })
})
