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
import { WorkspaceRepositories } from '../repository/workspace'
import { Repository } from '../repository'

const mockedWorkspaceChanged = mocked(new EventEmitter<void>())
const mockedWorkspaceChangedFire = jest.fn()
mockedWorkspaceChanged.fire = mockedWorkspaceChangedFire

const mockedTreeDataChanged = mocked(new EventEmitter<void>())
const mockedTreeDataChangedFire = jest.fn()
mockedTreeDataChanged.fire = mockedTreeDataChangedFire
mockedTreeDataChanged.event = jest.fn()

const mockedGetRepository = jest.fn()
const mockedGetChildren = jest.fn()
const mockedRepositories = {
  getRepository: mockedGetRepository,
  isReady: () => Promise.resolve(),
  treeDataChanged: mockedTreeDataChanged
} as unknown as WorkspaceRepositories

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)

const mockedDisposable = mocked(Disposable)

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

const mockedExists = mocked(exists)
const mockedIsDirectory = mocked(isDirectory)

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('.')
jest.mock('../cli/reader')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(mockedDisposer)
  mockedGetRepository.mockReturnValue({
    getChildren: mockedGetChildren
  } as unknown as Repository)
})

describe('TrackedTreeView', () => {
  const dvcDemoPath = join(__dirname, '..', '..', '..', 'demo')

  describe('initialize', () => {
    it('should fire the event emitter to reset the data in the view', async () => {
      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedRepositories
      )
      await trackedTreeView.initialize([dvcDemoPath])

      expect(mockedTreeDataChangedFire).toBeCalledTimes(1)
    })
  })

  describe('getChildren', () => {
    it('should return the roots if no path is provided and there is more than one', async () => {
      const mockedOtherRoot = join('some', 'other', 'root')
      const mockedDvcRoots = [dvcDemoPath, mockedOtherRoot]

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedRepositories
      )
      await trackedTreeView.initialize(mockedDvcRoots)

      const getRootPathItem = (dvcRoot: string) => ({
        dvcRoot,
        isDirectory: true,
        resourceUri: Uri.file(dvcRoot)
      })

      mockedGetChildren.mockImplementation(getRootPathItem)

      const rootElements = trackedTreeView.getChildren()

      expect(rootElements).toEqual(mockedDvcRoots.map(getRootPathItem))
      expect(mockedGetRepository).toBeCalledTimes(2)
      expect(mockedGetRepository).toBeCalledWith(dvcDemoPath)
      expect(mockedGetRepository).toBeCalledWith(mockedOtherRoot)
      expect(mockedGetChildren).toBeCalledTimes(2)
    })

    it('should get the children for the provided element', async () => {
      const data = join(dvcDemoPath, 'data')
      const dataUri = Uri.file(data)

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedRepositories
      )
      await trackedTreeView.initialize([dvcDemoPath])

      const mockedRootItems = [
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          resourceUri: dataUri
        },
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          resourceUri: Uri.file(join(dvcDemoPath, 'logs'))
        },
        {
          dvcRoot: dvcDemoPath,
          isDirectory: false,
          resourceUri: Uri.file(join(dvcDemoPath, 'model.pt'))
        }
      ]

      mockedGetChildren.mockReturnValueOnce(mockedRootItems)

      const rootElements = trackedTreeView.getChildren()

      expect(mockedGetRepository).toBeCalledTimes(1)
      expect(mockedGetRepository).toBeCalledWith(dvcDemoPath)
      expect(mockedGetChildren).toBeCalledWith(dvcDemoPath)
      expect(rootElements).toEqual(mockedRootItems)

      mockedGetRepository.mockClear()
      mockedGetChildren.mockClear()

      const mockedDirItems = [
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          resourceUri: Uri.file(join(dvcDemoPath, 'data', 'MNIST'))
        }
      ]

      mockedGetChildren.mockReturnValueOnce(mockedDirItems)

      const child = trackedTreeView.getChildren({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
        resourceUri: dataUri
      })

      expect(mockedGetRepository).toBeCalledTimes(1)
      expect(mockedGetRepository).toBeCalledWith(dvcDemoPath)
      expect(mockedGetChildren).toBeCalledWith(data)
      expect(child).toEqual(mockedDirItems)
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

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedRepositories
      )
      await trackedTreeView.initialize([dvcDemoPath])

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
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
        mockedRepositories
      )
      mockedExists.mockReturnValueOnce(false)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        resourceUri: log
      })

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem,
        contextValue: 'virtual'
      })
    })

    it('should return the correct tree item for a directory which is tracked by DVC', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const trackedTreeView = new TrackedExplorerTree(
        mockedInternalCommands,
        mockedWorkspaceChanged,
        mockedRepositories
      )
      mockedExists.mockReturnValueOnce(true).mockReturnValueOnce(true)

      mockedIsDirectory.mockReturnValueOnce(true)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
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
        mockedRepositories
      )
      mockedExists.mockReturnValueOnce(true)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: false,
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
        contextValue: 'file'
      })
    })
  })
})
