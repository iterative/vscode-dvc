import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { commands, TreeItem, TreeItemCollapsibleState, window } from 'vscode'
import { ExperimentsColumnsTree } from './tree'
import { appendColumnToPath, joinColumnPath, splitColumnPath } from './paths'
import columnsFixture from '../../test/fixtures/expShow/columns'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'
import { buildMockedExperiments } from '../../test/util/jest'
import { Status } from '../../path/selection/model'
import { ColumnType } from '../webview/contract'

const mockedCommands = jest.mocked(commands)
mockedCommands.registerCommand = jest.fn()

mockedCommands.registerCommand = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = jest.mocked(TreeItem)

const mockedDisposable = jest.mocked(Disposable)

const { mockedExperiments, mockedGetChildColumns, mockedGetDvcRoots } =
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

describe('ExperimentsColumnsTree', () => {
  const getLabel = (path: string): string => {
    const pathArray = splitColumnPath(path)
    const [label] = pathArray.slice(-1)
    return label
  }

  const rootColumns = columnsFixture
    .filter(column =>
      Object.values<string>(ColumnType).includes(column.parentPath)
    )
    .map(column => ({
      ...column,
      descendantStatuses: [],
      label: getLabel(column.path),
      status: Status.SELECTED
    }))

  describe('getChildren', () => {
    it('should return the experiments roots if there are multiple repositories and no path is provided', async () => {
      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )
      const mockedDvcRoots = [
        join('path', 'to', 'first', 'root'),
        join('path', 'to', 'second', 'root')
      ]

      mockedGetDvcRoots.mockReturnValueOnce(mockedDvcRoots)

      expect(await experimentsColumnsTree.getChildren()).toStrictEqual(
        mockedDvcRoots
      )
    })

    it('should return the params and metrics if there is only a single repository and no path is provided', async () => {
      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )
      const mockedDvcRoot = join('path', 'to', 'only', 'root')

      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])
      mockedGetChildColumns.mockReturnValueOnce(rootColumns)

      const children = await experimentsColumnsTree.getChildren()

      expect(children).toStrictEqual([
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'summary.json',
          path: joinColumnPath(ColumnType.METRICS, 'summary.json')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'params.yaml',
          path: joinColumnPath(ColumnType.PARAMS, 'params.yaml')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: join('nested', 'params.yaml'),
          path: joinColumnPath(ColumnType.PARAMS, join('nested', 'params.yaml'))
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'data',
          path: joinColumnPath(ColumnType.DEPS, 'data')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'src',
          path: joinColumnPath(ColumnType.DEPS, 'src')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'model.pkl',
          path: joinColumnPath(ColumnType.DEPS, 'model.pkl')
        }
      ])
    })

    it("should return the param's children if a path is provided", async () => {
      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )

      const mockedDvcRoot = join('path', 'to', 'dvc', 'repo')
      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      mockedGetChildColumns.mockReturnValueOnce(rootColumns)

      await experimentsColumnsTree.getChildren()

      mockedGetChildColumns.mockReturnValueOnce(rootColumns)

      const children = await experimentsColumnsTree.getChildren(mockedDvcRoot)

      const paramsPath = joinColumnPath(ColumnType.PARAMS, 'params.yaml')
      const processPath = appendColumnToPath(paramsPath, 'process')

      expect(children).toStrictEqual([
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'summary.json',
          path: joinColumnPath(ColumnType.METRICS, 'summary.json')
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
          path: joinColumnPath(ColumnType.PARAMS, join('nested', 'params.yaml'))
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'data',
          path: joinColumnPath(ColumnType.DEPS, 'data')
        },
        {
          collapsibleState: 1,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'src',
          path: joinColumnPath(ColumnType.DEPS, 'src')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'model.pkl',
          path: joinColumnPath(ColumnType.DEPS, 'model.pkl')
        }
      ])

      mockedGetChildColumns.mockReturnValueOnce(
        columnsFixture
          .filter(column => paramsPath === column.parentPath)
          .map(param => {
            if (param.path === processPath) {
              return {
                ...param,
                descendantStatuses: [Status.UNSELECTED, Status.SELECTED],
                hasChildren: true,
                label: getLabel(param.path),
                status: Status.INDETERMINATE
              }
            }
            return {
              ...param,
              descendantStatuses: undefined,
              hasChildren: false,
              label: getLabel(param.path),
              status: Status.SELECTED
            }
          })
      )

      const grandChildren = await experimentsColumnsTree.getChildren({
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
          label: 'code_names',
          path: appendColumnToPath(paramsPath, 'code_names')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'epochs',
          path: appendColumnToPath(paramsPath, 'epochs')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'learning_rate',
          path: appendColumnToPath(paramsPath, 'learning_rate')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'dvc_logs_dir',
          path: appendColumnToPath(paramsPath, 'dvc_logs_dir')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'log_file',
          path: appendColumnToPath(paramsPath, 'log_file')
        },
        {
          collapsibleState: 0,
          description: undefined,
          dvcRoot: mockedDvcRoot,
          iconPath: mockedSelectedCheckbox,
          label: 'dropout',
          path: appendColumnToPath(paramsPath, 'dropout')
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

      mockedGetChildColumns.mockReturnValueOnce(
        columnsFixture
          .filter(column => processPath === column.parentPath)
          .map(param => ({
            ...param,
            descendantStatuses: undefined,
            hasChildren: false,
            label: getLabel(param.path),
            status: Status.SELECTED
          }))
      )
      const greatGrandChildren = await experimentsColumnsTree.getChildren({
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
          path: joinColumnPath(
            ColumnType.PARAMS,
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
          path: joinColumnPath(
            ColumnType.PARAMS,
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

      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )

      const mockedDvcRoot = join('dvc', 'repo')

      const treeItem = experimentsColumnsTree.getTreeItem(mockedDvcRoot)

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

    const experimentsColumnsTree = new ExperimentsColumnsTree(
      mockedExperiments,
      mockedInternalCommands,
      mockedResourceLocator
    )

    const filename = 'params.yml'
    const relParamsPath = joinColumnPath(ColumnType.PARAMS, filename)

    const columnsItem = {
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      description: '3/4',
      dvcRoot: mockedDvcRoot,
      iconPath: mockedSelectedCheckbox,
      label: filename,
      path: relParamsPath
    }

    const treeItem = experimentsColumnsTree.getTreeItem(columnsItem)

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

    const experimentsColumnsTree = new ExperimentsColumnsTree(
      mockedExperiments,
      mockedInternalCommands,
      mockedResourceLocator
    )

    const filename = 'params.yml'
    const relParamsPath = joinColumnPath(ColumnType.PARAMS, filename)

    const columnsItem = {
      collapsibleState: TreeItemCollapsibleState.None,
      description: undefined,
      dvcRoot: mockedDvcRoot,
      iconPath: mockedEmptyCheckbox,
      label: filename,
      path: relParamsPath
    }

    const treeItem = experimentsColumnsTree.getTreeItem(columnsItem)

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
