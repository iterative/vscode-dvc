import { commands, EventEmitter, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Config } from '../../Config'
import { TrackedExplorerTree } from './TrackedExplorerTree'
import { join } from 'path'
import { listDvcOnly } from '../../cli/reader'

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
const mockedGetCliPath = jest.fn()
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject,
  getCliPath: mockedGetCliPath
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

  describe('getChildren', () => {
    it('should get the root directory children when no element is provided', async () => {
      const trackedTreeView = new TrackedExplorerTree(
        mockedConfig,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      const dvcDemoPath = join(__dirname, '..', '..', '..', 'demo')
      trackedTreeView.initialize([dvcDemoPath])

      const mockedListDvcOnly = mocked(listDvcOnly)
      mockedListDvcOnly.mockResolvedValueOnce([
        { isout: false, isdir: true, isexec: false, path: 'data' },
        { isout: true, isdir: true, isexec: false, path: 'logs' },
        { isout: true, isdir: false, isexec: false, path: 'model.pt' }
      ])

      const rootElements = await trackedTreeView.getChildren()
      expect(rootElements).toEqual([
        join(dvcDemoPath, 'data'),
        join(dvcDemoPath, 'logs'),
        join(dvcDemoPath, 'model.pt')
      ])

      mockedListDvcOnly.mockResolvedValueOnce([
        { isout: false, isdir: true, isexec: false, path: 'MNIST' }
      ])

      const child = await trackedTreeView.getChildren(join(dvcDemoPath, 'data'))
      expect(child).toEqual([join(dvcDemoPath, 'data', 'MNIST')])
    })
  })
})
