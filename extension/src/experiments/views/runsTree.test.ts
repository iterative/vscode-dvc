import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, window } from 'vscode'
import { ExperimentsRunsTree } from './runsTree'
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

const mockedGetRunningOrQueued = jest.fn()
const mockedExperiments = {
  getRunningOrQueued: mockedGetRunningOrQueued,
  isReady: () => true,
  onDidRunsOrQueuedChange: jest.fn()
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

describe('ExperimentsRunsTree', () => {
  describe('getChildren', () => {
    it('(placeholder) should return an empty array', async () => {
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetRunningOrQueued.mockReturnValue([])
      const rootElements = await experimentsRunsTree.getChildren()
      expect(rootElements).toEqual([])
    })
  })
})
