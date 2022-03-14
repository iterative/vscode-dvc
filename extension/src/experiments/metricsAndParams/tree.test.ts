import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { commands, TreeItem, TreeItemCollapsibleState, window } from 'vscode'
import { ExperimentsMetricsAndParamsTree } from './tree'
import { joinMetricOrParamPath } from './paths'
import columnsFixture from '../../test/fixtures/expShow/columns'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'
import { buildMockedExperiments } from '../../test/util/jest'
import { Status } from '../../path/selection/model'

const mockedCommands = jest.mocked(commands)
mockedCommands.registerCommand = jest.fn()

mockedCommands.registerCommand = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = jest.mocked(TreeItem)

const mockedDisposable = jest.mocked(Disposable)

const { mockedExperiments, mockedGetChildMetricsOrParams, mockedGetDvcRoots } =
  buildMockedExperiments()

const mockedInternalCommands = {
  registerExternalCommand: jest.fn()
} as unknown as InternalCommands

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

describe('ExperimentsMetricsAndParamsTree', () => {
  const rootMetricsAndParams = columnsFixture
    .filter(metricOrParam =>
      ['metrics', 'params'].includes(metricOrParam.parentPath)
    )
    .map(metricOrParam => ({
      ...metricOrParam,
      descendantStatuses: [],
      status: Status.SELECTED
    }))

  describe('getChildren', () => {
    it('should return the experiments roots if there are multiple repositories and no path is provided', async () => {
      const experimentsMetricsAndParamsTree =
        new ExperimentsMetricsAndParamsTree(
          mockedExperiments,
          mockedInternalCommands,
          mockedResourceLocator
        )
      const mockedDvcRoots = [
        join('path', 'to', 'first', 'root'),
        join('path', 'to', 'second', 'root')
      ]

      mockedGetDvcRoots.mockReturnValueOnce(mockedDvcRoots)

      expect(await experimentsMetricsAndParamsTree.getChildren()).toStrictEqual(
        mockedDvcRoots
      )
    })

    it('should return the params and metrics if there is only a single repository and no path is provided', async () => {
      const experimentsMetricsAndParamsTree =
        new ExperimentsMetricsAndParamsTree(
          mockedExperiments,
          mockedInternalCommands,
          mockedResourceLocator
        )
      const mockedDvcRoot = join('path', 'to', 'only', 'root')

      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])
      mockedGetChildMetricsOrParams.mockReturnValueOnce(rootMetricsAndParams)

      const children = await experimentsMetricsAndParamsTree.getChildren()

      expect(children).toStrictEqual([
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'summary.json',
          path: joinMetricOrParamPath('metrics', 'summary.json')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'params.yaml',
          path: joinMetricOrParamPath('params', 'params.yaml')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: join('nested', 'params.yaml'),
          path: joinMetricOrParamPath('params', join('nested', 'params.yaml'))
        }
      ])
    })

    it("should return the param's children if a path is provided", async () => {
      const experimentsMetricsAndParamsTree =
        new ExperimentsMetricsAndParamsTree(
          mockedExperiments,
          mockedInternalCommands,
          mockedResourceLocator
        )

      const mockedDvcRoot = join('path', 'to', 'dvc', 'repo')
      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      mockedGetChildMetricsOrParams.mockReturnValueOnce(rootMetricsAndParams)

      await experimentsMetricsAndParamsTree.getChildren()

      mockedGetChildMetricsOrParams.mockReturnValueOnce(rootMetricsAndParams)

      const children = await experimentsMetricsAndParamsTree.getChildren(
        mockedDvcRoot
      )

      const paramsPath = joinMetricOrParamPath('params', 'params.yaml')
      const processPath = joinMetricOrParamPath(
        'params',
        'params.yaml',
        'process'
      )

      expect(children).toStrictEqual([
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'summary.json',
          path: joinMetricOrParamPath('metrics', 'summary.json')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'params.yaml',
          path: paramsPath
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: join('nested', 'params.yaml'),
          path: joinMetricOrParamPath('params', join('nested', 'params.yaml'))
        }
      ])

      mockedGetChildMetricsOrParams.mockReturnValueOnce(
        columnsFixture
          .filter(metricOrParam => paramsPath === metricOrParam.parentPath)
          .map(param => {
            if (param.path === processPath) {
              return {
                ...param,
                descendantStatuses: [Status.UNSELECTED, Status.SELECTED],
                hasChildren: true,
                status: Status.INDETERMINATE
              }
            }
            return {
              ...param,
              descendantStatuses: undefined,
              hasChildren: false,
              status: Status.SELECTED
            }
          })
      )

      const grandChildren = await experimentsMetricsAndParamsTree.getChildren({
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        description: undefined,
        dvcRoot: mockedDvcRoot,
        iconPath: mockedSelectedCheckbox,
        label: 'params.yaml',
        path: paramsPath
      })
      expect(grandChildren).toStrictEqual([
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'epochs',
          path: joinMetricOrParamPath(paramsPath, 'epochs')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'learning_rate',
          path: joinMetricOrParamPath(paramsPath, 'learning_rate')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'dvc_logs_dir',
          path: joinMetricOrParamPath(paramsPath, 'dvc_logs_dir')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'log_file',
          path: joinMetricOrParamPath(paramsPath, 'log_file')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'dropout',
          path: joinMetricOrParamPath(paramsPath, 'dropout')
        },
        {
          collapsibleState: 1,
          description: '1/2',
          dvcRoot: mockedDvcRoot,
          iconPath: mockedIndeterminateCheckbox,
          label: 'process',
          path: processPath
        }
      ])

      mockedGetChildMetricsOrParams.mockReturnValueOnce(
        columnsFixture
          .filter(metricOrParam => processPath === metricOrParam.parentPath)
          .map(param => ({
            ...param,
            descendantStatuses: undefined,
            hasChildren: false,
            status: Status.SELECTED
          }))
      )
      const greatGrandChildren =
        await experimentsMetricsAndParamsTree.getChildren({
          collapsibleState: TreeItemCollapsibleState.Collapsed,
          description: '1/2',
          dvcRoot: mockedDvcRoot,
          iconPath: mockedIndeterminateCheckbox,
          label: 'process',
          path: processPath
        })

      expect(greatGrandChildren).toStrictEqual([
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'threshold',
          path: joinMetricOrParamPath(
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
          label: 'test_arg',
          path: joinMetricOrParamPath(
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
        expect(collapsibleState).toStrictEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const experimentsMetricsAndParamsTree =
        new ExperimentsMetricsAndParamsTree(
          mockedExperiments,
          mockedInternalCommands,
          mockedResourceLocator
        )

      const mockedDvcRoot = join('dvc', 'repo')

      const treeItem =
        experimentsMetricsAndParamsTree.getTreeItem(mockedDvcRoot)

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toStrictEqual({
        ...mockedItem
      })
    })
  })

  it('should return the correct tree item for a selected param file with children', () => {
    const mockedDvcRoot = join('dvc', 'repo')
    mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
      return { collapsibleState, uri }
    })

    const experimentsMetricsAndParamsTree = new ExperimentsMetricsAndParamsTree(
      mockedExperiments,
      mockedInternalCommands,
      mockedResourceLocator
    )

    const filename = 'params.yml'
    const relParamsPath = joinMetricOrParamPath('params', filename)

    const metricsAndParamsItem = {
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      description: '3/4',
      dvcRoot: mockedDvcRoot,
      iconPath: mockedSelectedCheckbox,
      label: filename,
      path: relParamsPath
    }

    const treeItem =
      experimentsMetricsAndParamsTree.getTreeItem(metricsAndParamsItem)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(treeItem).toStrictEqual({
      collapsibleState: 1,
      command: {
        arguments: [{ dvcRoot: mockedDvcRoot, path: relParamsPath }],
        command: RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
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

    const experimentsMetricsAndParamsTree = new ExperimentsMetricsAndParamsTree(
      mockedExperiments,
      mockedInternalCommands,
      mockedResourceLocator
    )

    const filename = 'params.yml'
    const relParamsPath = joinMetricOrParamPath('params', filename)

    const metricsAndParamsItem = {
      collapsibleState: TreeItemCollapsibleState.None,
      description: undefined,
      dvcRoot: mockedDvcRoot,
      iconPath: mockedEmptyCheckbox,
      label: filename,
      path: relParamsPath
    }

    const treeItem =
      experimentsMetricsAndParamsTree.getTreeItem(metricsAndParamsItem)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(treeItem).toStrictEqual({
      collapsibleState: 0,
      command: {
        arguments: [{ dvcRoot: mockedDvcRoot, path: relParamsPath }],
        command: RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
        title: 'toggle'
      },
      iconPath: mockedEmptyCheckbox,
      uri: filename
    })
  })
})
