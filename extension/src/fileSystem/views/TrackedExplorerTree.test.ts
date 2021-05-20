import { commands, EventEmitter, TreeItem, Uri, window } from 'vscode'
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
const mockedTreeItem = mocked(TreeItem)

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
  const dvcDemoPath = join(__dirname, '..', '..', '..', 'demo')

  describe('initialize', () => {
    it('should fire the event emitter to reset the data in the view', () => {
      const trackedTreeView = new TrackedExplorerTree(
        mockedConfig,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize([dvcDemoPath])

      expect(mockedTreeDataChangedFire).toBeCalledTimes(1)
    })
  })

  describe('getChildren', () => {
    it('should get the children for the provided element', async () => {
      const trackedTreeView = new TrackedExplorerTree(
        mockedConfig,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
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

  describe('getTreeItem', () => {
    it('should return the correct tree item for a directory', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function(uri, collapsibleState) {
        mockedItem = { uri, collapsibleState }
        return mockedItem
      })

      const trackedTreeView = new TrackedExplorerTree(
        mockedConfig,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize([dvcDemoPath])

      const mockedListDvcOnly = mocked(listDvcOnly)
      mockedListDvcOnly.mockResolvedValueOnce([
        { isout: false, isdir: true, isexec: false, path: 'data' },
        { isout: true, isdir: true, isexec: false, path: 'logs' },
        { isout: true, isdir: false, isexec: false, path: 'model.pt' }
      ])

      await trackedTreeView.getChildren()
      const treeItem = trackedTreeView.getTreeItem(join(dvcDemoPath, 'data'))

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem,
        contextValue: 'dvc'
      })
    })

    it('should return the correct tree item for a file', () => {
      let mockedItem = {}
      const log = join(dvcDemoPath, 'logs', 'acc.tsv')
      const mockedUri = Uri.file(log)
      mockedTreeItem.mockImplementationOnce(function(uri, collapsibleState) {
        mockedItem = { uri, collapsibleState }
        return mockedItem
      })

      const trackedTreeView = new TrackedExplorerTree(
        mockedConfig,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )

      const treeItem = trackedTreeView.getTreeItem(log)

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem,
        command: {
          arguments: [mockedUri],
          command: 'dvc.views.trackedExplorerTree.openFile',
          title: 'Open File'
        },
        contextValue: 'dvcHasRemote'
      })
    })
  })
})
