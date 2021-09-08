import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import {
  commands,
  EventEmitter,
  TreeItem,
  TreeItemCollapsibleState,
  window
} from 'vscode'
import { ExperimentsParamsAndMetricsTree } from './tree'
import complexColumnData from '../../test/fixtures/complex-column-example'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { Experiments } from '..'
import { Status } from '../paramsAndMetrics/model'
import { joinParamOrMetricPath } from '../../util/paths'
import { RegisteredCommands } from '../../commands/external'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedParamsOrMetricsChanged = mocked(new EventEmitter<void>())
const mockedParamsOrMetricsChangedFire = jest.fn()
const mockedParamsOrMetricsChangedEvent = jest.fn()
mockedParamsOrMetricsChanged.fire = mockedParamsOrMetricsChangedFire
mockedParamsOrMetricsChanged.event = mockedParamsOrMetricsChangedEvent

mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)

const mockedDisposable = mocked(Disposable)

const mockedGetChildParamsOrMetrics = jest.fn()
const mockedGetDvcRoots = jest.fn()
const mockedExperiments = {
  getChildParamsOrMetrics: mockedGetChildParamsOrMetrics,
  getDvcRoots: mockedGetDvcRoots,
  isReady: () => true,
  paramsOrMetricsChanged: mockedParamsOrMetricsChanged
} as unknown as Experiments

const mockedSelectedCheckbox = {
  dark: join('path', 'to', 'checkbox-c.svg'),
  light: join('path', 'to', 'checkbox-c.svg')
} as unknown as Resource
const mockedIndeterminateCheckbox = {
  dark: join('path', 'to', 'checkbox-i.svg'),
  light: join('path', 'to', 'checkbox-i.svg')
} as unknown as Resource
const mockedEmptyCheckbox = {
  dark: join('path', 'to', 'checkbox-e.svg'),
  light: join('path', 'to', 'checkbox-e.svg')
} as unknown as Resource
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

describe('ExperimentsParamsAndMetricsTree', () => {
  const rootParamsAndMetrics = complexColumnData
    .filter(paramOrMetric =>
      ['metrics', 'params'].includes(paramOrMetric.parentPath)
    )
    .map(paramOrMetric => ({
      ...paramOrMetric,
      descendantStatuses: [],
      status: Status.selected
    }))

  describe('getChildren', () => {
    it('should return the experiments roots if there are multiple repositories and no path is provided', async () => {
      const experimentsParamsAndMetricsTree =
        new ExperimentsParamsAndMetricsTree(
          mockedExperiments,
          mockedResourceLocator
        )
      const mockedDvcRoots = [
        join('path', 'to', 'first', 'root'),
        join('path', 'to', 'second', 'root')
      ]

      mockedGetDvcRoots.mockReturnValueOnce(mockedDvcRoots)

      expect(await experimentsParamsAndMetricsTree.getChildren()).toEqual(
        mockedDvcRoots
      )
    })

    it('should return the params and metrics if there is only a single repository and no path is provided', async () => {
      const experimentsParamsAndMetricsTree =
        new ExperimentsParamsAndMetricsTree(
          mockedExperiments,
          mockedResourceLocator
        )
      const mockedDvcRoot = join('path', 'to', 'only', 'root')

      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])
      mockedGetChildParamsOrMetrics.mockReturnValueOnce(rootParamsAndMetrics)

      const children = await experimentsParamsAndMetricsTree.getChildren()

      expect(children).toEqual([
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath('params', 'params.yaml')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath('params', join('nested', 'params.yaml'))
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath('metrics', 'summary.json')
        }
      ])
    })

    it("should return the param's children if a path is provided", async () => {
      const experimentsParamsAndMetricsTree =
        new ExperimentsParamsAndMetricsTree(
          mockedExperiments,
          mockedResourceLocator
        )

      const mockedDvcRoot = join('path', 'to', 'dvc', 'repo')
      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(rootParamsAndMetrics)

      await experimentsParamsAndMetricsTree.getChildren()

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(rootParamsAndMetrics)

      const children = await experimentsParamsAndMetricsTree.getChildren(
        mockedDvcRoot
      )

      const paramsPath = joinParamOrMetricPath('params', 'params.yaml')
      const processPath = joinParamOrMetricPath(
        'params',
        'params.yaml',
        'process'
      )

      expect(children).toEqual([
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: paramsPath
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath('params', join('nested', 'params.yaml'))
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath('metrics', 'summary.json')
        }
      ])

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData
          .filter(paramOrMetric => paramsPath === paramOrMetric.parentPath)
          .map(param => {
            if (param.path === processPath) {
              return {
                ...param,
                descendantStatuses: [Status.unselected, Status.selected],
                hasChildren: true,
                status: Status.indeterminate
              }
            }
            return {
              ...param,
              descendantStatuses: undefined,
              hasChildren: false,
              status: Status.selected
            }
          })
      )

      const grandChildren = await experimentsParamsAndMetricsTree.getChildren({
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        description: undefined,
        dvcRoot: mockedDvcRoot,
        iconPath: mockedSelectedCheckbox,
        path: paramsPath
      })
      expect(grandChildren).toEqual([
        {
          collapsibleState: 0,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath(paramsPath, 'epochs')
        },
        {
          collapsibleState: 0,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath(paramsPath, 'learning_rate')
        },
        {
          collapsibleState: 0,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath(paramsPath, 'dvc_logs_dir')
        },
        {
          collapsibleState: 0,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath(paramsPath, 'log_file')
        },
        {
          collapsibleState: 0,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath(paramsPath, 'dropout')
        },
        {
          collapsibleState: 1,
          description: '1/2',
          dvcRoot: mockedDvcRoot,
          iconPath: mockedIndeterminateCheckbox,
          path: processPath
        }
      ])

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData
          .filter(paramOrMetric => processPath === paramOrMetric.parentPath)
          .map(param => ({
            ...param,
            descendantStatuses: undefined,
            hasChildren: false,
            status: Status.selected
          }))
      )
      const greatGrandChildren =
        await experimentsParamsAndMetricsTree.getChildren({
          collapsibleState: TreeItemCollapsibleState.Collapsed,
          description: '1/2',
          dvcRoot: mockedDvcRoot,
          iconPath: mockedIndeterminateCheckbox,
          path: processPath
        })

      expect(greatGrandChildren).toEqual([
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath(
            'params',
            'params.yaml',
            'process',
            'threshold'
          )
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          path: joinParamOrMetricPath(
            'params',
            'params.yaml',
            'process',
            'test_arg'
          )
        }
      ])
    })
  })

  describe('getTreeItem', () => {
    it('should return the correct tree item for a repository root', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const experimentsParamsAndMetricsTree =
        new ExperimentsParamsAndMetricsTree(
          mockedExperiments,
          mockedResourceLocator
        )

      const mockedDvcRoot = join('dvc', 'repo')

      const treeItem =
        experimentsParamsAndMetricsTree.getTreeItem(mockedDvcRoot)

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem
      })
    })
  })

  it('should return the correct tree item for a selected param file with children', () => {
    const mockedDvcRoot = join('dvc', 'repo')
    mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
      return { collapsibleState, uri }
    })

    const experimentsParamsAndMetricsTree = new ExperimentsParamsAndMetricsTree(
      mockedExperiments,
      mockedResourceLocator
    )

    const filename = 'params.yml'
    const relParamsPath = joinParamOrMetricPath('params', filename)

    const paramsAndMetricsItem = {
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      description: '3/4',
      dvcRoot: mockedDvcRoot,
      iconPath: mockedSelectedCheckbox,
      path: relParamsPath
    }

    const treeItem =
      experimentsParamsAndMetricsTree.getTreeItem(paramsAndMetricsItem)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(treeItem).toEqual({
      collapsibleState: 1,
      command: {
        arguments: [{ dvcRoot: mockedDvcRoot, path: relParamsPath }],
        command: RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        title: 'toggle'
      },
      description: '3/4',
      iconPath: mockedSelectedCheckbox,
      uri: filename
    })
  })

  it('should return the correct tree item for a unselected params file without children', () => {
    const mockedDvcRoot = join('dvc', 'repo')
    mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
      return { collapsibleState, uri }
    })

    const experimentsParamsAndMetricsTree = new ExperimentsParamsAndMetricsTree(
      mockedExperiments,
      mockedResourceLocator
    )

    const filename = 'params.yml'
    const relParamsPath = joinParamOrMetricPath('params', filename)

    const paramsAndMetricsItem = {
      collapsibleState: TreeItemCollapsibleState.None,
      description: undefined,
      dvcRoot: mockedDvcRoot,
      iconPath: mockedEmptyCheckbox,
      path: relParamsPath
    }

    const treeItem =
      experimentsParamsAndMetricsTree.getTreeItem(paramsAndMetricsItem)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(treeItem).toEqual({
      collapsibleState: 0,
      command: {
        arguments: [{ dvcRoot: mockedDvcRoot, path: relParamsPath }],
        command: RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
        title: 'toggle'
      },
      iconPath: mockedEmptyCheckbox,
      uri: filename
    })
  })
})
