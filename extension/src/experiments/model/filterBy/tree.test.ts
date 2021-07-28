import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, ThemeIcon, TreeItem, window } from 'vscode'
import { Operator } from '.'
import { ExperimentsFilterByTree } from './tree'
import { Experiments } from '../..'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedExperimentsChanged = mocked(new EventEmitter<string | void>())
const mockedExperimentDataChangedFire = jest.fn()
mockedExperimentsChanged.fire = mockedExperimentDataChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)
const mockedThemeIcon = mocked(ThemeIcon)

const mockedDisposable = mocked(Disposable)

const mockedGetDvcRoots = jest.fn()
const mockedGetFilters = jest.fn()
const mockedGetFilter = jest.fn()
const mockedExperiments = {
  experimentsChanged: mockedExperimentsChanged,
  getDvcRoots: mockedGetDvcRoots,
  getFilter: mockedGetFilter,
  getFilters: mockedGetFilters,
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

describe('ExperimentsFilterByTree', () => {
  describe('getChildren', () => {
    it('should return an empty array if no root elements are found', async () => {
      const experimentsFilterByTree = new ExperimentsFilterByTree(
        mockedExperiments
      )
      mockedGetDvcRoots.mockReturnValueOnce([])
      const rootElements = await experimentsFilterByTree.getChildren()
      expect(rootElements).toEqual([])
    })
  })

  it('should return an empty array if no filters are found under the root elements', async () => {
    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments
    )
    mockedGetDvcRoots.mockReturnValueOnce(['demo'])
    mockedGetFilters.mockReturnValueOnce([])
    const rootElements = await experimentsFilterByTree.getChildren()
    expect(rootElements).toEqual([])
  })

  it("should return the repository's filters if there is only one repository", async () => {
    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments
    )
    const mockedFilters = [
      {
        operator: Operator.EQUAL,
        path: join('params', 'params.yaml', 'param'),
        value: '90000'
      }
    ]
    const dvcRoots = ['demo']
    mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
    mockedGetFilters.mockReturnValueOnce(mockedFilters)
    mockedGetFilters.mockReturnValueOnce(mockedFilters)

    const filters = await experimentsFilterByTree.getChildren()
    expect(filters).toEqual([
      join('demo', 'params', 'params.yaml', 'param==90000')
    ])
  })

  it('should return an array of dvcRoots if one has a filter applied', async () => {
    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments
    )
    const dvcRoots = ['demo', 'other']
    mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
    mockedGetFilters.mockReturnValueOnce([
      {
        operator: Operator.EQUAL,
        path: join('params', 'params.yaml', 'param'),
        value: '90000'
      }
    ])
    mockedGetFilters.mockReturnValueOnce([])
    const rootElements = await experimentsFilterByTree.getChildren()
    expect(rootElements).toEqual(dvcRoots)
  })

  it("should return the dvcRoot's filters if one is provided", async () => {
    const mockedFilters = [
      {
        operator: '==',
        path: join('params', 'params.yml', 'param'),
        value: 90000
      },
      {
        operator: '<',
        path: join('metrics', 'logs.json', 'metric'),
        value: '1'
      }
    ]

    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments
    )
    const dvcRoots = ['demo', 'and', 'another']
    mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
    mockedGetFilters.mockReturnValueOnce(mockedFilters)
    mockedGetFilters.mockReturnValueOnce([])
    mockedGetFilters.mockReturnValueOnce([])
    await experimentsFilterByTree.getChildren()

    mockedGetFilters.mockReturnValueOnce(mockedFilters)
    const filters = await experimentsFilterByTree.getChildren('demo')

    expect(filters).toEqual([
      join('demo', 'params', 'params.yml', 'param==90000'),
      join('demo', 'metrics', 'logs.json', 'metric<1')
    ])
  })

  describe('getTreeItem', () => {
    it('should return a tree item for a root element', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      const experimentsFilterByTree = new ExperimentsFilterByTree(
        mockedExperiments
      )
      const dvcRoot = 'other'
      mockedGetFilters.mockReturnValueOnce([])
      mockedGetDvcRoots.mockReturnValueOnce([dvcRoot])
      await experimentsFilterByTree.getChildren()
      const item = experimentsFilterByTree.getTreeItem(dvcRoot)

      expect(item).toEqual({ ...mockedItem, contextValue: 'dvcFilterRoot' })
    })

    it('should return a tree item for a filter', async () => {
      const mockedFilter = {
        operator: '>=',
        path: join('metrics', 'summary.json', 'success_metric'),
        value: '100'
      }
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsFilterByTree = new ExperimentsFilterByTree(
        mockedExperiments
      )
      const dvcRoot = 'other'
      mockedGetDvcRoots.mockReturnValueOnce([dvcRoot])
      mockedGetFilters.mockReturnValueOnce([mockedFilter])
      mockedGetFilters.mockReturnValueOnce([mockedFilter])
      await experimentsFilterByTree.getChildren()

      mockedGetFilter.mockReturnValueOnce(mockedFilter)
      const item = experimentsFilterByTree.getTreeItem(
        join(dvcRoot, 'metrics', 'summary.json', 'success_metric>=100')
      )

      expect(item).toEqual({
        ...mockedItem,
        contextValue: 'dvcFilter',
        description: '>= 100',
        iconPath: { id: 'filter' },
        label: mockedFilter.path
      })
    })
  })
})
