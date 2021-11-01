import { join } from 'path'
import { commands, EventEmitter, TreeItem, Uri, window } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { exists, isDirectory } from '.'
import { TrackedExplorerTree } from './tree'
import { Config } from '../config'
import { InternalCommands } from '../commands/internal'
import { RegisteredCommands } from '../commands/external'
import { OutputChannel } from '../vscode/outputChannel'

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

const mockedListDvcOnly = jest.fn()

const mockedDisposer = {
  track: function <T>(disposable: T): T {
    return disposable
  }
} as unknown as (() => void) & Disposer
mockedDisposable.fn.mockReturnValueOnce(mockedDisposer)
const mockedInternalCommands = new InternalCommands(
  {} as Config,
  {
    show: jest.fn()
  } as unknown as OutputChannel
)

mockedInternalCommands.registerCommand('listDvcOnly', (...args) =>
  mockedListDvcOnly(...args)
)

const mockedExists = mocked(exists)
const mockedIsDirectory = mocked(isDirectory)

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('.')
jest.mock('../cli/reader')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(mockedDisposer)
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
    it('should return the roots if no path is provided and there is more than one', async () => {
      const mockedDvcRoots = [dvcDemoPath, join('some', 'other', 'root')]

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize(mockedDvcRoots)

      const rootElements = await trackedTreeView.getChildren()

      expect(rootElements).toEqual(
        mockedDvcRoots.map(dvcRoot => ({
          dvcRoot,
          isDirectory: true,
          isOut: false,
          resourceUri: Uri.file(dvcRoot)
        }))
      )
      expect(mockedListDvcOnly).not.toBeCalled()
    })

    it('should get the children for the provided element', async () => {
      mockedListDvcOnly.mockResolvedValueOnce(demoRootList)
      const dataUri = Uri.file(join(dvcDemoPath, 'data'))

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize([dvcDemoPath])

      const rootElements = await trackedTreeView.getChildren()
      expect(rootElements).toEqual([
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isOut: false,
          resourceUri: expect.objectContaining({
            fsPath: dataUri.fsPath
          })
        },
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isOut: true,
          resourceUri: expect.objectContaining({
            fsPath: join(dvcDemoPath, 'logs')
          })
        },
        {
          dvcRoot: dvcDemoPath,
          isDirectory: false,
          isOut: true,
          resourceUri: expect.objectContaining({
            fsPath: join(dvcDemoPath, 'model.pt')
          })
        }
      ])

      mockedListDvcOnly.mockResolvedValueOnce([
        { isdir: true, isexec: false, isout: false, path: 'MNIST' }
      ])

      const child = await trackedTreeView.getChildren({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
        isOut: false,
        resourceUri: dataUri
      })
      expect(child).toEqual([
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isOut: false,
          resourceUri: expect.objectContaining({
            fsPath: join(dvcDemoPath, 'data', 'MNIST')
          })
        }
      ])
    })
  })

  describe('getTreeItem', () => {
    it('should return the correct tree item for a virtual directory', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      mockedExists.mockReturnValueOnce(false)

      mockedListDvcOnly.mockResolvedValueOnce(demoRootList)

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      trackedTreeView.initialize([dvcDemoPath])

      await trackedTreeView.getChildren()
      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
        isOut: false,
        resourceUri: Uri.file(join(dvcDemoPath, 'data'))
      })

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem,
        contextValue: 'virtual'
      })
    })

    it('should return the correct tree item for a virtual file', () => {
      let mockedItem = {}
      const log = Uri.file(join(dvcDemoPath, 'logs', 'acc.tsv'))
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      mockedExists.mockReturnValueOnce(false)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isOut: false,
        resourceUri: log
      })

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem,
        contextValue: 'virtual'
      })
    })

    it('should return the correct tree item for a directory which is tracked by DVC', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      mockedListDvcOnly.mockResolvedValueOnce(demoRootList)

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      mockedExists
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)

      mockedIsDirectory.mockReturnValueOnce(true)

      trackedTreeView.initialize([dvcDemoPath])

      await trackedTreeView.getChildren()

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
        isOut: false,
        resourceUri: Uri.file(join(dvcDemoPath, 'data'))
      })

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem,
        contextValue: 'dirData'
      })
    })

    it('should return the correct tree item for a file', () => {
      let mockedItem = {}
      const log = Uri.file(join(dvcDemoPath, 'logs', 'acc.tsv'))
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        expect(uri).toEqual(log)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedTreeDataChanged
      )
      mockedExists.mockReturnValueOnce(true)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isOut: false,
        resourceUri: log
      })

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem,
        command: {
          arguments: [log],
          command: RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
          title: 'Open File'
        },
        contextValue: 'fileHasRemote'
      })
    })
  })
})
