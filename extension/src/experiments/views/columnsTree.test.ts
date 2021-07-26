import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, TreeItem, Uri, window } from 'vscode'
import { ExperimentsColumnsTree } from './columnsTree'
import complexColumnData from '../webview/complex-column-example.json'
import { ResourceLocator } from '../../resourceLocator'
import { Experiments } from '..'
import { ParamOrMetric } from '../webview/contract'
import { Status } from '../model/paramsAndMetrics'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedParamsOrMetricsChanged = mocked(new EventEmitter<void>())
const mockedParamsOrMetricsChangedFire = jest.fn()
mockedParamsOrMetricsChanged.fire = mockedParamsOrMetricsChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)

const mockedDisposable = mocked(Disposable)

const mockedGetChildParamsOrMetrics = jest.fn()
const mockedGetParamOrMetric = jest.fn()
const mockedGetDvcRoots = jest.fn()
const mockedExperiments = {
  getChildParamsOrMetrics: mockedGetChildParamsOrMetrics,
  getDvcRoots: mockedGetDvcRoots,
  getParamOrMetric: mockedGetParamOrMetric,
  isReady: () => true,
  paramsOrMetricsChanged: mockedParamsOrMetricsChanged
} as unknown as Experiments

const mockedSelectedCheckbox = {
  dark: join('path', 'to', 'checkbox-c.svg'),
  light: join('path', 'to', 'checkbox-c.svg')
}
const mockedIndeterminateCheckbox = {
  dark: join('path', 'to', 'checkbox-i.svg'),
  light: join('path', 'to', 'checkbox-i.svg')
}
const mockedEmptyCheckbox = {
  dark: join('path', 'to', 'checkbox-e.svg'),
  light: join('path', 'to', 'checkbox-e.svg')
}
const mockedResourceLocator = {
  checkedCheckbox: mockedSelectedCheckbox,
  emptyCheckbox: mockedEmptyCheckbox,
  indeterminateCheckbox: mockedIndeterminateCheckbox
} as unknown as ResourceLocator

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

describe('ExperimentsColumnsTree', () => {
  describe('getChildren', () => {
    it('should return the experiments roots if there are multiple repositories and no path is provided', async () => {
      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      const mockedDvcRoots = [
        join('path', 'to', 'first', 'root'),
        join('path', 'to', 'second', 'root')
      ]

      mockedGetDvcRoots.mockReturnValueOnce(mockedDvcRoots)

      expect(await experimentsColumnsTree.getChildren()).toEqual(mockedDvcRoots)
    })

    it('should return the params and metrics if there is only a single repository and no path is provided', async () => {
      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      const mockedDvcRoot = join('path', 'to', 'only', 'root')

      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])
      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData.filter(column =>
          ['metrics', 'params'].includes(column.parentPath)
        )
      )

      const children = await experimentsColumnsTree.getChildren()

      expect(children).toEqual([
        join(mockedDvcRoot, 'params', 'params.yaml'),
        join(mockedDvcRoot, 'metrics', 'summary.json')
      ])
    })

    it("should return the column's children if a path is provided", async () => {
      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const mockedDvcRoot = join('path', 'to', 'dvc', 'repo')
      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      await experimentsColumnsTree.getChildren()

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData.filter(column =>
          ['metrics', 'params'].includes(column.parentPath)
        )
      )

      const children = await experimentsColumnsTree.getChildren(mockedDvcRoot)
      const relParamsPath = join('params', 'params.yaml')
      const paramsPath = join(mockedDvcRoot, relParamsPath)

      expect(children).toEqual([
        paramsPath,
        join(mockedDvcRoot, 'metrics', 'summary.json')
      ])

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData.filter(column => relParamsPath === column.parentPath)
      )
      const grandChildren = await experimentsColumnsTree.getChildren(paramsPath)
      const relParamsProcessPath = join(relParamsPath, 'process')
      const paramsProcessPath = join(mockedDvcRoot, relParamsProcessPath)

      expect(grandChildren).toEqual([
        join(paramsPath, 'epochs'),
        join(paramsPath, 'learning_rate'),
        join(paramsPath, 'dvc_logs_dir'),
        join(paramsPath, 'log_file'),
        join(paramsPath, 'dropout'),
        paramsProcessPath
      ])

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData.filter(
          column => relParamsProcessPath === column.parentPath
        )
      )
      const greatGrandChildren = await experimentsColumnsTree.getChildren(
        paramsProcessPath
      )

      expect(greatGrandChildren).toEqual([
        join(paramsProcessPath, 'threshold'),
        join(paramsProcessPath, 'test_arg')
      ])
    })
  })

  describe('getTreeItem', () => {
    it('should return the correct tree item for a repository root', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const mockedDvcRoot = join('dvc', 'repo')

      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      await experimentsColumnsTree.getChildren()

      const treeItem = experimentsColumnsTree.getTreeItem(mockedDvcRoot)

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem
      })
    })
  })

  it('should return the correct tree item for a selected column with children', () => {
    const mockedDvcRoot = join('dvc', 'repo')
    mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
      return { collapsibleState, uri }
    })

    const experimentsColumnsTree = new ExperimentsColumnsTree(
      mockedExperiments,
      mockedResourceLocator
    )

    const relParamsPath = join('params', 'params.yml')
    const paramsPath = join(mockedDvcRoot, relParamsPath)

    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(experimentsColumnsTree as any, 'getDetails')
      .mockReturnValueOnce([mockedDvcRoot, relParamsPath])

    mockedGetParamOrMetric.mockReturnValueOnce({
      descendantMetadata: '3/4',
      hasChildren: true,
      status: Status.selected
    } as unknown as ParamOrMetric)

    const treeItem = experimentsColumnsTree.getTreeItem(paramsPath)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(mockedGetParamOrMetric).toBeCalledTimes(1)
    expect(mockedGetParamOrMetric).toBeCalledWith(mockedDvcRoot, relParamsPath)
    expect(treeItem).toEqual({
      collapsibleState: 1,
      command: {
        arguments: [paramsPath],
        command: 'dvc.views.experimentsColumnsTree.toggleStatus',
        title: 'toggle'
      },
      description: '3/4',
      iconPath: mockedSelectedCheckbox,
      uri: Uri.file(paramsPath)
    })
  })

  it('should return the correct tree item for a unselected column without children', () => {
    const mockedDvcRoot = join('dvc', 'repo')
    mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
      return { collapsibleState, uri }
    })

    const experimentsColumnsTree = new ExperimentsColumnsTree(
      mockedExperiments,
      mockedResourceLocator
    )

    const relParamsPath = join('params', 'prms.yml')
    const paramsPath = join(mockedDvcRoot, relParamsPath)

    jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(experimentsColumnsTree as any, 'getDetails')
      .mockReturnValueOnce([mockedDvcRoot, relParamsPath])

    mockedGetParamOrMetric.mockReturnValueOnce({
      hasChildren: false,
      status: Status.unselected
    } as unknown as ParamOrMetric)

    const treeItem = experimentsColumnsTree.getTreeItem(paramsPath)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(mockedGetParamOrMetric).toBeCalledTimes(1)
    expect(mockedGetParamOrMetric).toBeCalledWith(mockedDvcRoot, relParamsPath)
    expect(treeItem).toEqual({
      collapsibleState: 0,
      command: {
        arguments: [paramsPath],
        command: 'dvc.views.experimentsColumnsTree.toggleStatus',
        title: 'toggle'
      },
      iconPath: mockedEmptyCheckbox,
      uri: Uri.file(paramsPath)
    })
  })
})
