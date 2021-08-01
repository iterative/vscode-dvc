import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import {
  commands,
  EventEmitter,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  TreeItemLabel,
  Uri,
  window
} from 'vscode'
import { SortDefinition } from '.'
import { ExperimentsSortByTree, SortDefinitionWithParent } from './tree'
import { Experiments } from '../..'

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

const mockedTreeItem = mocked(TreeItem)

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedExperimentsChanged = mocked(new EventEmitter<string | void>())
const mockedExperimentDataChangedFire = jest.fn()
mockedExperimentsChanged.fire = mockedExperimentDataChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()

const mockedDisposable = mocked(Disposable)

const mockedGetSorts = jest.fn()
const mockedGetDvcRoots = jest.fn()
const mockedExperiments = {
  experimentsChanged: mockedExperimentsChanged,
  getDvcRoots: mockedGetDvcRoots,
  getSorts: mockedGetSorts,
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

describe('ExperimentsSortByTree', () => {
  const parent = 'demo'
  const examplePath = join('params', 'test')
  const exampleSortDefinition: SortDefinition = {
    descending: true,
    path: examplePath
  }
  const exampleSortDefinitionWithParent: SortDefinitionWithParent = {
    parent,
    sort: exampleSortDefinition
  }
  const singleSortDefinitionArray = [exampleSortDefinition]
  const singleSortDefinitionWithParentArray = [exampleSortDefinitionWithParent]

  describe('getChildren', () => {
    it('should return an empty array', async () => {
      mockedGetSorts.mockReturnValueOnce([])
      mockedGetDvcRoots.mockReturnValueOnce([])
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      const rootElements = await experimentsSortByTree.getChildren(undefined)
      expect(rootElements).toEqual([])
    })

    it('should not display projects when only one project exists', async () => {
      mockedGetSorts.mockReturnValueOnce(singleSortDefinitionArray)
      mockedGetDvcRoots.mockReturnValueOnce([parent])
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      expect(await experimentsSortByTree.getChildren(undefined)).toEqual(
        singleSortDefinitionWithParentArray
      )
    })

    it('should display projects at the top level when more than one exists', async () => {
      mockedGetDvcRoots.mockReturnValueOnce([parent, 'demo2'])
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      expect(await experimentsSortByTree.getChildren(undefined)).toEqual([
        parent,
        'demo2'
      ])
    })

    it('should be able to display sort items under a top-level project', async () => {
      mockedGetSorts.mockReturnValueOnce(singleSortDefinitionArray)
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      expect(await experimentsSortByTree.getChildren(parent)).toEqual(
        singleSortDefinitionWithParentArray
      )
    })
  })

  describe('getTreeItem', () => {
    it('should be able to make a TreeItem from a dvcRoot string', () => {
      mockedTreeItem.mockImplementation(buildMockedTreeItem)
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      expect(experimentsSortByTree.getTreeItem(parent)).toEqual({
        collapsibleState: TreeItemCollapsibleState.Expanded,
        contextValue: 'dvcSortRoot',
        id: parent,
        resourceUri: Uri.file(parent)
      })
    })

    it('should be able to make a TreeItem from a descending SortDefinition', () => {
      mockedTreeItem.mockImplementation(buildMockedTreeItem)
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      expect(
        experimentsSortByTree.getTreeItem(exampleSortDefinitionWithParent)
      ).toEqual({
        collapsibleState: TreeItemCollapsibleState.None,
        contextValue: 'dvcSort',
        iconPath: new ThemeIcon('arrow-down'),
        label: examplePath
      })
    })

    it('should be able to make a TreeItem from an ascending SortDefinition', () => {
      mockedTreeItem.mockImplementation(buildMockedTreeItem)
      const experimentsSortByTree = new ExperimentsSortByTree(mockedExperiments)
      const otherPath = join('other', parent, 'path')
      expect(
        experimentsSortByTree.getTreeItem({
          parent,
          sort: {
            descending: false,
            path: otherPath
          }
        })
      ).toEqual({
        collapsibleState: TreeItemCollapsibleState.None,
        contextValue: 'dvcSort',
        iconPath: new ThemeIcon('arrow-down'),
        label: otherPath
      })
    })
  })
})
