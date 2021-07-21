import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, window } from 'vscode'
import { ExperimentsFilterByTree } from './filterByTree'
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

const mockedGetDvcRoots = jest.fn()
const mockedGetFilteredBy = jest.fn()
const mockedExperiments = {
  experimentsRowsChanged: mockedExperimentsRowsChanged,
  getDvcRoots: mockedGetDvcRoots,
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
    it('should return an empty array if no root elements are found', async () => {
      const experimentsFilterByTree = new ExperimentsFilterByTree(
        mockedExperiments
      )
      mockedGetDvcRoots.mockReturnValueOnce([])
      const rootElements = await experimentsFilterByTree.getChildren()
      expect(rootElements).toEqual([])
    })
  })

  it('should return an empty array if no filters are found under the root elements', async () => {
    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments
    )
    mockedGetDvcRoots.mockReturnValueOnce(['demo'])
    mockedGetFilteredBy.mockReturnValueOnce([])
    const rootElements = await experimentsFilterByTree.getChildren()
    expect(rootElements).toEqual([])
  })
})
