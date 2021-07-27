import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, window } from 'vscode'
import { ExperimentsSortByTree } from './sortByTree'
import { Experiments } from '..'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedExperimentsRowsChanged = mocked(new EventEmitter<string | void>())
const mockedExperimentDataChangedFire = jest.fn()
mockedExperimentsRowsChanged.fire = mockedExperimentDataChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()

const mockedDisposable = mocked(Disposable)

const mockedGetSortedBy = jest.fn()
const mockedGetDvcRoots = jest.fn()
const mockedGetFilters = jest.fn()
const mockedGetFilter = jest.fn()
const mockedExperiments = {
  experimentsRowsChanged: mockedExperimentsRowsChanged,
  getDvcRoots: mockedGetDvcRoots,
  getFilter: mockedGetFilter,
  getFilters: mockedGetFilters,
  getSortedBy: mockedGetSortedBy,
  isReady: () => true
} as unknown as Experiments

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

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

describe('ExperimentsSortByTree', () => {
  describe('getChildren', () => {
    it('should return an empty array', () => {
      mockedGetSortedBy.mockReturnValue([])
      mockedGetDvcRoots.mockReturnValueOnce([])
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      const rootElements = experimentsSortByTree.getChildren(undefined)
      expect(rootElements).toEqual([])
    })
  })
})
