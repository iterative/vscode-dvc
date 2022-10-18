import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  commands,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  TreeItemLabel,
  Uri,
  window
} from 'vscode'
import { SortDefinition } from '.'
import { ExperimentsSortByTree, SortItem } from './tree'
import { buildMetricOrParamPath } from '../../columns/paths'
import { InternalCommands } from '../../../commands/internal'
import { buildMockedExperiments } from '../../../test/util/jest'
import { ColumnType } from '../../webview/contract'

function buildMockedTreeItem(
  arg1: string | TreeItemLabel | Uri,
  collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None
) {
  const item: TreeItem = { collapsibleState }
  if (typeof arg1 === 'object' && (arg1 as Uri).path) {
    item.resourceUri = arg1 as Uri
  } else {
    item.label = arg1 as TreeItemLabel
  }
  return item
}

const mockedTreeItem = jest.mocked(TreeItem)

const mockedCommands = jest.mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()

const mockedDisposable = jest.mocked(Disposable)

const { mockedExperiments, mockedGetSorts, mockedGetDvcRoots } =
  buildMockedExperiments()

const mockedInternalCommands = {
  registerExternalCommand: jest.fn()
} as unknown as InternalCommands

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
  const dvcRoot = 'demo'
  const examplePath = buildMetricOrParamPath(ColumnType.PARAMS, 'test')
  const exampleSortDefinition: SortDefinition = {
    descending: true,
    path: examplePath
  }
  const exampleSortDefinitionWithParent: SortItem = {
    dvcRoot,
    sort: exampleSortDefinition
  }
  const singleSortDefinitionArray = [exampleSortDefinition]
  const singleSortDefinitionWithParentArray = [exampleSortDefinitionWithParent]

  describe('getChildren', () => {
    it('should return an empty array if no roots are defined', async () => {
      mockedGetDvcRoots.mockReturnValueOnce([])
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      const rootElements = await experimentsSortByTree.getChildren(undefined)
      expect(rootElements).toStrictEqual([])
    })

    it('should return an empty array if there are roots but no sorts', async () => {
      mockedGetDvcRoots.mockReturnValueOnce([dvcRoot])
      mockedGetSorts.mockReturnValue([])
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      const rootElements = await experimentsSortByTree.getChildren(undefined)
      expect(rootElements).toStrictEqual([])
    })

    it('should display sorts at the top level when only one project exists', async () => {
      mockedGetSorts.mockReturnValue(singleSortDefinitionArray)
      mockedGetDvcRoots.mockReturnValue([dvcRoot])
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      expect(await experimentsSortByTree.getChildren(undefined)).toStrictEqual(
        singleSortDefinitionWithParentArray
      )
    })

    it('should display projects at the top level when more than one exists', async () => {
      mockedGetDvcRoots.mockReturnValueOnce([dvcRoot, 'demo2'])
      mockedGetSorts.mockReturnValue(singleSortDefinitionArray)
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      expect(await experimentsSortByTree.getChildren(undefined)).toStrictEqual([
        dvcRoot,
        'demo2'
      ])
    })

    it('should be able to display sort items under a top-level project', async () => {
      mockedGetSorts.mockReturnValueOnce(singleSortDefinitionArray)
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      expect(await experimentsSortByTree.getChildren(dvcRoot)).toStrictEqual(
        singleSortDefinitionWithParentArray
      )
    })
  })

  describe('getTreeItem', () => {
    it('should be able to make a TreeItem from a dvcRoot string', () => {
      mockedTreeItem.mockImplementation(buildMockedTreeItem)
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      expect(experimentsSortByTree.getTreeItem(dvcRoot)).toStrictEqual({
        collapsibleState: TreeItemCollapsibleState.Expanded,
        contextValue: 'dvcRoot',
        id: dvcRoot,
        resourceUri: Uri.file(dvcRoot)
      })
    })

    it('should be able to make a TreeItem from a descending SortDefinition', () => {
      mockedTreeItem.mockImplementation(buildMockedTreeItem)
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      expect(
        experimentsSortByTree.getTreeItem(exampleSortDefinitionWithParent)
      ).toStrictEqual({
        collapsibleState: TreeItemCollapsibleState.None,
        iconPath: new ThemeIcon('arrow-down'),
        label: examplePath
      })
    })

    it('should be able to make a TreeItem from an ascending SortDefinition', () => {
      mockedTreeItem.mockImplementation(buildMockedTreeItem)
      const experimentsSortByTree = new ExperimentsSortByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      const otherPath = join('other', dvcRoot, 'path')
      expect(
        experimentsSortByTree.getTreeItem({
          dvcRoot,
          sort: {
            descending: false,
            path: otherPath
          }
        })
      ).toStrictEqual({
        collapsibleState: TreeItemCollapsibleState.None,
        iconPath: new ThemeIcon('arrow-down'),
        label: otherPath
      })
    })
  })
})
