import { join } from 'path'
import { commands, EventEmitter, TreeItem, Uri, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { TrackedExplorerTree } from './trackedExplorerTree'
import { Config } from '../../config'
import { InternalCommands } from '../../internalCommands'

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

const mockedListDvcOnly = jest.fn()
const mockedInternalCommands = new InternalCommands({
  getDefaultProject: mockedGetDefaultProject
} as unknown as Config)

mockedInternalCommands.registerCommand('listDvcOnly', (...args) =>
  mockedListDvcOnly(...args)
)

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../../cli/reader')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('TrackedTreeView', () => {
  const dvcDemoPath = join(__dirname, '..', '..', '..', 'demo')

  const demoRootList = [
    { isdir: true, isexec: false, isout: false, path: 'data' },
    { isdir: true, isexec: false, isout: true, path: 'logs' },
    { isdir: false, isexec: false, isout: true, path: 'model.pt' }
  ]

  describe('initialize', () => {
    it('should fire the event emitter to reset the data in the view', () => {
      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize([dvcDemoPath])

      expect(mockedTreeDataChangedFire).toBeCalledTimes(1)
    })
  })

  describe('getChildren', () => {
    it('should get the children for the provided element', async () => {
      mockedListDvcOnly.mockResolvedValueOnce(demoRootList)

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize([dvcDemoPath])

      const rootElements = await trackedTreeView.getChildren()
      expect(rootElements).toEqual([
        join(dvcDemoPath, 'data'),
        join(dvcDemoPath, 'logs'),
        join(dvcDemoPath, 'model.pt')
      ])

      mockedListDvcOnly.mockResolvedValueOnce([
        { isdir: true, isexec: false, isout: false, path: 'MNIST' }
      ])

      const child = await trackedTreeView.getChildren(join(dvcDemoPath, 'data'))
      expect(child).toEqual([join(dvcDemoPath, 'data', 'MNIST')])
    })
  })

  describe('getTreeItem', () => {
    it('should return the correct tree item for a directory', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      mockedListDvcOnly.mockResolvedValueOnce(demoRootList)

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize([dvcDemoPath])

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
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        expect(uri).toEqual(mockedUri)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
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
