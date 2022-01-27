import { Disposable, Disposer } from '@hediet/std/disposable'
import { commands, ThemeIcon, TreeItem, window } from 'vscode'
import { Operator } from '.'
import { ExperimentsFilterByTree } from './tree'
import { joinMetricOrParamPath } from '../../metricsAndParams/paths'
import { InternalCommands } from '../../../commands/internal'
import { buildMockedExperiments } from '../../../test/util/jest'

const mockedCommands = jest.mocked(commands)
mockedCommands.registerCommand = jest.fn()
mockedCommands.registerCommand = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = jest.mocked(TreeItem)
const mockedThemeIcon = jest.mocked(ThemeIcon)

const mockedDisposable = jest.mocked(Disposable)

const {
  mockedExperiments,
  mockedGetDvcRoots,
  mockedGetFilters,
  mockedGetFilter
} = buildMockedExperiments()

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

describe('ExperimentsFilterByTree', () => {
  describe('getChildren', () => {
    it('should return an empty array if no root elements are found', async () => {
      const experimentsFilterByTree = new ExperimentsFilterByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      mockedGetDvcRoots.mockReturnValueOnce([])
      const rootElements = await experimentsFilterByTree.getChildren()
      expect(rootElements).toEqual([])
    })
  })

  it('should return an empty array if no filters are found under the root elements', async () => {
    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments,
      mockedInternalCommands
    )
    mockedGetDvcRoots.mockReturnValueOnce(['demo'])
    mockedGetFilters.mockReturnValueOnce([])
    const rootElements = await experimentsFilterByTree.getChildren()
    expect(rootElements).toEqual([])
  })

  it("should return the repository's filters if there is only one repository", async () => {
    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments,
      mockedInternalCommands
    )
    const mockedFilters = [
      {
        operator: Operator.EQUAL,
        path: joinMetricOrParamPath('params', 'params.yaml', 'param'),
        value: '90000'
      }
    ]
    const dvcRoots = ['demo']
    mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
    mockedGetFilters.mockReturnValueOnce(mockedFilters)
    mockedGetFilters.mockReturnValueOnce(mockedFilters)

    const filters = await experimentsFilterByTree.getChildren()
    expect(filters).toEqual([
      {
        description: '== 90000',
        dvcRoot: 'demo',
        id: joinMetricOrParamPath('params', 'params.yaml', 'param==90000'),
        label: joinMetricOrParamPath('params', 'params.yaml', 'param')
      }
    ])
  })

  it('should return an array of dvcRoots if one has a filter applied', async () => {
    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments,
      mockedInternalCommands
    )
    const dvcRoots = ['demo', 'other']
    mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
    mockedGetFilters.mockReturnValueOnce([
      {
        operator: Operator.EQUAL,
        path: joinMetricOrParamPath('params', 'params.yaml', 'param'),
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
        path: joinMetricOrParamPath('params', 'params.yml', 'param'),
        value: 90000
      },
      {
        operator: '<',
        path: joinMetricOrParamPath('metrics', 'logs.json', 'metric'),
        value: '1'
      }
    ]

    const experimentsFilterByTree = new ExperimentsFilterByTree(
      mockedExperiments,
      mockedInternalCommands
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
      {
        description: '== 90000',
        dvcRoot: 'demo',
        id: joinMetricOrParamPath('params', 'params.yml', 'param==90000'),
        label: joinMetricOrParamPath('params', 'params.yml', 'param')
      },
      {
        description: '< 1',
        dvcRoot: 'demo',
        id: joinMetricOrParamPath('metrics', 'logs.json', 'metric<1'),
        label: joinMetricOrParamPath('metrics', 'logs.json', 'metric')
      }
    ])
  })

  describe('getTreeItem', () => {
    it('should return a tree item for a root element', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(2)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      const experimentsFilterByTree = new ExperimentsFilterByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      const dvcRoot = 'other'
      mockedGetFilters.mockReturnValueOnce([])
      mockedGetDvcRoots.mockReturnValueOnce([dvcRoot])
      await experimentsFilterByTree.getChildren()
      const item = experimentsFilterByTree.getTreeItem(dvcRoot)

      expect(item).toEqual({ ...mockedItem, contextValue: 'dvcRoot' })
    })

    it('should return a tree item for a filter', async () => {
      const mockedFilter = {
        operator: '>=',
        path: joinMetricOrParamPath(
          'metrics',
          'summary.json',
          'success_metric'
        ),
        value: '100'
      }
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsFilterByTree = new ExperimentsFilterByTree(
        mockedExperiments,
        mockedInternalCommands
      )
      const dvcRoot = 'other'
      mockedGetDvcRoots.mockReturnValueOnce([dvcRoot])
      mockedGetFilters.mockReturnValueOnce([mockedFilter])
      mockedGetFilters.mockReturnValueOnce([mockedFilter])
      await experimentsFilterByTree.getChildren()

      mockedGetFilter.mockReturnValueOnce(mockedFilter)
      const item = experimentsFilterByTree.getTreeItem({
        description: '>= 100',
        dvcRoot,
        id: joinMetricOrParamPath(
          'metrics',
          'summary.json',
          'success_metric>=100'
        ),
        label: joinMetricOrParamPath(
          'metrics',
          'summary.json',
          'success_metric'
        )
      })

      expect(item).toEqual({
        ...mockedItem,
        description: '>= 100',
        iconPath: { id: 'filter' }
      })
    })
  })
})
