import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, TreeItem, Uri, window } from 'vscode'
import { ExperimentsParamsAndMetricsTree } from './tree'
import complexColumnData from '../webview/complex-column-example.json'
import { ResourceLocator } from '../../resourceLocator'
import { Experiments } from '..'
import { Status } from '../paramsAndMetrics/model'

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
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: true,
          path: join('params', 'params.yaml'),
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: true,
          path: join('metrics', 'summary.json'),
          status: Status.selected
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

      const paramsPath = join('params', 'params.yaml')
      const processPath = join(paramsPath, 'process')

      expect(children).toEqual([
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: true,
          path: paramsPath,
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: true,
          path: join('metrics', 'summary.json'),
          status: Status.selected
        }
      ])

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData
          .filter(paramOrMetric => paramsPath === paramOrMetric.parentPath)
          .map(param => ({
            ...param,
            descendantStatuses: [],
            hasChildren: param.path === processPath,
            status: Status.selected
          }))
      )
      const grandChildren = await experimentsParamsAndMetricsTree.getChildren({
        dvcRoot: mockedDvcRoot,
        hasChildren: true,
        path: paramsPath,
        status: Status.selected
      })
      expect(grandChildren).toEqual([
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: false,
          path: join(paramsPath, 'epochs'),
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: false,
          path: join(paramsPath, 'learning_rate'),
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: false,
          path: join(paramsPath, 'dvc_logs_dir'),
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: false,
          path: join(paramsPath, 'log_file'),
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: false,
          path: join(paramsPath, 'dropout'),
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: true,
          path: processPath,
          status: Status.selected
        }
      ])

      mockedGetChildParamsOrMetrics.mockReturnValueOnce(
        complexColumnData
          .filter(paramOrMetric => processPath === paramOrMetric.parentPath)
          .map(param => ({
            ...param,
            descendantStatuses: [],
            hasChildren: false,
            status: Status.selected
          }))
      )
      const greatGrandChildren =
        await experimentsParamsAndMetricsTree.getChildren({
          dvcRoot: mockedDvcRoot,
          hasChildren: true,
          path: processPath,
          status: Status.selected
        })

      expect(greatGrandChildren).toEqual([
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: false,
          path: join(processPath, 'threshold'),
          status: Status.selected
        },
        {
          descendantStatuses: [],
          dvcRoot: mockedDvcRoot,
          hasChildren: false,
          path: join(processPath, 'test_arg'),
          status: Status.selected
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

    const relParamsPath = join('params', 'params.yml')
    const paramsPath = join(mockedDvcRoot, relParamsPath)

    const paramsAndMetricsItem = {
      descendantStatuses: [
        Status.selected,
        Status.selected,
        Status.selected,
        Status.unselected
      ],
      dvcRoot: mockedDvcRoot,
      hasChildren: true,
      path: relParamsPath,
      status: Status.selected
    }

    const treeItem =
      experimentsParamsAndMetricsTree.getTreeItem(paramsAndMetricsItem)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(treeItem).toEqual({
      collapsibleState: 1,
      command: {
        arguments: [paramsAndMetricsItem],
        command: 'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
        title: 'toggle'
      },
      description: '3/4',
      iconPath: mockedSelectedCheckbox,
      uri: Uri.file(paramsPath)
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

    const relParamsPath = join('params', 'params.yml')
    const paramsPath = join(mockedDvcRoot, relParamsPath)

    const paramsAndMetricsItem = {
      dvcRoot: mockedDvcRoot,
      hasChildren: false,
      path: relParamsPath,
      status: Status.unselected
    }

    const treeItem =
      experimentsParamsAndMetricsTree.getTreeItem(paramsAndMetricsItem)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(treeItem).toEqual({
      collapsibleState: 0,
      command: {
        arguments: [paramsAndMetricsItem],
        command: 'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
        title: 'toggle'
      },
      iconPath: mockedEmptyCheckbox,
      uri: Uri.file(paramsPath)
    })
  })
})
