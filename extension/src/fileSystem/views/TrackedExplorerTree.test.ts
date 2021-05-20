import { commands, EventEmitter, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Config } from '../../Config'
import { TrackedExplorerTree } from './TrackedExplorerTree'
import { join } from 'path'

const mockedWorkspaceChanged = mocked(new EventEmitter<void>())
const mockedWorkspaceChangedFire = jest.fn()
mockedWorkspaceChanged.fire = mockedWorkspaceChangedFire

const mockedTreeDataChanged = mocked(new EventEmitter<void>())
const mockedTreeDataChangedFire = jest.fn()
mockedTreeDataChanged.fire = mockedTreeDataChangedFire

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedGetDefaultProject = jest.fn()
const mockedGetExecutionOptions = jest.fn()
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject,
  getExecutionOptions: mockedGetExecutionOptions
} as unknown) as Config

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../../cli/reader')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('TrackedTreeView', () => {
  describe('initialize', () => {
    it('should fire the event emitter to reset the data in the view', () => {
      const trackedTreeView = new TrackedExplorerTree(
        mockedConfig,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      const dvcDemoPath = join(__dirname, '..', '..', '..', 'demo')
      trackedTreeView.initialize([dvcDemoPath])

      expect(mockedTreeDataChangedFire).toBeCalledTimes(1)
    })
  })
})
