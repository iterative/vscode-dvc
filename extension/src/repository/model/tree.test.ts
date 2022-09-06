import { basename, join, resolve } from 'path'
import {
  commands,
  EventEmitter,
  MarkdownString,
  TreeItem,
  Uri,
  window
} from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { PathItem } from './collect'
import { RepositoriesTree } from './tree'
import { Repository } from '..'
import { WorkspaceRepositories } from '../workspace'
import { exists, isDirectory } from '../../fileSystem'
import { getWorkspaceFolders } from '../../vscode/workspaceFolders'
import { InternalCommands } from '../../commands/internal'
import { RegisteredCommands } from '../../commands/external'
import { OutputChannel } from '../../vscode/outputChannel'
import { dvcDemoPath } from '../../test/util'
import { getDecoratableUri, DecoratableTreeItemScheme } from '../../tree'
import { getMarkdownString } from '../../vscode/markdownString'

const mockedTreeDataChanged = jest.mocked(new EventEmitter<void>())
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

const mockedCommands = jest.mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = jest.mocked(TreeItem)

const mockedDisposable = jest.mocked(Disposable)

const mockedDisposer = {
  track: function <T>(disposable: T): T {
    return disposable
  }
} as unknown as (() => void) & Disposer
mockedDisposable.fn.mockReturnValueOnce(mockedDisposer)
const mockedInternalCommands = new InternalCommands({
  show: jest.fn()
} as unknown as OutputChannel)

const mockedExists = jest.mocked(exists)
const mockedIsDirectory = jest.mocked(isDirectory)

const mockedGetWorkspaceFolders = jest.mocked(getWorkspaceFolders)

const mockedGetMarkdownString = jest.mocked(getMarkdownString)

jest.mock('vscode')
jest.mock('@hediet/std/disposable')
jest.mock('../../fileSystem')
jest.mock('../../cli/dvc/reader')
jest.mock('../../vscode/workspaceFolders')
jest.mock('../../vscode/markdownString')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(mockedDisposer)
  mockedGetRepository.mockReturnValue({
    getChildren: mockedGetChildren
  } as unknown as Repository)
})

describe('RepositoriesTree', () => {
  describe('initialize', () => {
    it('should fire the event emitter to reset the data in the view', () => {
      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      trackedTreeView.initialize([dvcDemoPath])

      expect(mockedTreeDataChangedFire).toHaveBeenCalledTimes(1)
    })
  })

  describe('getChildren', () => {
    it('should return the roots if no path is provided and there is more than one', async () => {
      const mockedOtherRoot = join('some', 'other', 'root')
      const mockedDvcRoots = [dvcDemoPath, mockedOtherRoot]

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      trackedTreeView.initialize(mockedDvcRoots)

      const rootElements = await trackedTreeView.getChildren()

      expect(rootElements).toStrictEqual([
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isTracked: true,
          resourceUri: Uri.file(dvcDemoPath)
        },
        {
          dvcRoot: mockedOtherRoot,
          isDirectory: true,
          isTracked: true,
          resourceUri: Uri.file(mockedOtherRoot)
        }
      ])
      expect(mockedGetRepository).toHaveBeenCalledTimes(0)
      expect(mockedGetChildren).toHaveBeenCalledTimes(0)
    })

    it('should return the single dvc root if it is nested', async () => {
      const mockedDvcRoots = [dvcDemoPath]
      mockedGetWorkspaceFolders.mockReturnValueOnce([
        resolve(dvcDemoPath, '..')
      ])

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      trackedTreeView.initialize(mockedDvcRoots)

      const rootElements = await trackedTreeView.getChildren()

      expect(rootElements).toStrictEqual([
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isTracked: true,
          resourceUri: Uri.file(dvcDemoPath)
        }
      ])
    })

    it('should return directories first in the list of root items', async () => {
      const mockedDvcRoots = [dvcDemoPath]
      mockedGetWorkspaceFolders.mockReturnValueOnce(mockedDvcRoots)

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      trackedTreeView.initialize(mockedDvcRoots)

      mockedGetChildren.mockReturnValueOnce([
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isTracked: true,
          resourceUri: Uri.file(join(dvcDemoPath, 'logs'))
        },
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isTracked: true,
          resourceUri: Uri.file(join(dvcDemoPath, 'data'))
        },
        {
          dvcRoot: dvcDemoPath,
          isDirectory: false,
          isTracked: true,
          resourceUri: Uri.file(join(dvcDemoPath, 'model.pt'))
        },
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          isTracked: true,
          resourceUri: Uri.file(join(dvcDemoPath, 'plots'))
        }
      ])

      const rootElements = await trackedTreeView.getChildren()

      expect(
        rootElements.map(({ resourceUri }) => basename(resourceUri.fsPath))
      ).toStrictEqual(['data', 'logs', 'plots', 'model.pt'])
      expect(mockedGetRepository).toHaveBeenCalledTimes(1)
      expect(mockedGetRepository).toHaveBeenCalledWith(dvcDemoPath)
      expect(mockedGetChildren).toHaveBeenCalledTimes(1)
    })

    it('should get the children for the provided element', async () => {
      const data = Uri.file(join(dvcDemoPath, 'data'))
      mockedGetWorkspaceFolders.mockReturnValueOnce([dvcDemoPath])

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      trackedTreeView.initialize([dvcDemoPath])

      const mockedRootItems = [
        {
          dvcRoot: dvcDemoPath,
          isDirectory: true,
          resourceUri: data
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

      const rootElements = await trackedTreeView.getChildren()

      expect(mockedGetRepository).toHaveBeenCalledTimes(1)
      expect(mockedGetRepository).toHaveBeenCalledWith(dvcDemoPath)
      expect(mockedGetChildren).toHaveBeenCalledWith(dvcDemoPath)
      expect(rootElements).toStrictEqual(mockedRootItems)

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

      const child = await trackedTreeView.getChildren({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
        isTracked: false,
        resourceUri: data
      })

      expect(mockedGetRepository).toHaveBeenCalledTimes(1)
      expect(mockedGetRepository).toHaveBeenCalledWith(dvcDemoPath)
      expect(mockedGetChildren).toHaveBeenCalledWith(data.fsPath)
      expect(child).toStrictEqual(mockedDirItems)
    })
  })

  describe('getTreeItem', () => {
    it('should return the correct tree item for a virtual directory', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toStrictEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      mockedExists.mockReturnValueOnce(false)

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      trackedTreeView.initialize([dvcDemoPath])

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
        isTracked: false,
        resourceUri: Uri.file(join(dvcDemoPath, 'data'))
      })

      expect(mockedTreeItem).toHaveBeenCalledTimes(1)
      expect(treeItem).toStrictEqual({
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

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      mockedExists.mockReturnValueOnce(false)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isTracked: true,
        resourceUri: log
      })

      expect(mockedTreeItem).toHaveBeenCalledTimes(1)
      expect(treeItem).toStrictEqual({
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

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      mockedExists.mockReturnValueOnce(true).mockReturnValueOnce(true)

      mockedIsDirectory.mockReturnValueOnce(true)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: true,
        isTracked: false,
        resourceUri: Uri.file(join(dvcDemoPath, 'data'))
      })

      expect(mockedTreeItem).toHaveBeenCalledTimes(1)
      expect(treeItem).toStrictEqual({
        ...mockedItem,
        contextValue: 'dirData'
      })
    })

    it('should return the correct tree item for a file', () => {
      let mockedItem = {}
      const log = Uri.file(join(dvcDemoPath, 'logs', 'acc.tsv'))
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toStrictEqual(0)
        expect(uri).toStrictEqual(log)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )
      mockedExists.mockReturnValueOnce(true)

      const treeItem = trackedTreeView.getTreeItem({
        dvcRoot: dvcDemoPath,
        isDirectory: false,
        isTracked: true,
        resourceUri: log
      })

      expect(mockedTreeItem).toHaveBeenCalledTimes(1)
      expect(treeItem).toStrictEqual({
        ...mockedItem,
        command: {
          arguments: [log],
          command: RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
          title: 'Open File'
        },
        contextValue: 'file'
      })
    })

    it('should return the correct tree item for an error', () => {
      let mockedItem = {}
      const label =
        'ERROR: unable to read: params.yaml, YAML file structure is corrupted: mapping values are not allowed in this context'

      const msg = `ERROR: unable to read: 'params.yaml', YAML file structure is corrupted: mapping values are not allowed in this context
      in "<unicode string>", line 3, column 9`
      mockedGetMarkdownString.mockImplementationOnce(
        str => str as unknown as MarkdownString
      )
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toStrictEqual(0)
        expect(uri).toStrictEqual(
          getDecoratableUri(label, DecoratableTreeItemScheme.TRACKED)
        )
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const trackedTreeView = new RepositoriesTree(
        mockedInternalCommands,
        mockedRepositories
      )

      const treeItem = trackedTreeView.getTreeItem({
        error: {
          label,
          msg
        }
      } as PathItem)

      expect(mockedTreeItem).toHaveBeenCalledTimes(1)
      expect(treeItem).toStrictEqual({
        ...mockedItem,
        command: {
          command: RegisteredCommands.EXTENSION_SHOW_OUTPUT,
          title: 'Show DVC Output'
        },
        tooltip: `$(error) ${msg}`
      })
    })
  })
})
