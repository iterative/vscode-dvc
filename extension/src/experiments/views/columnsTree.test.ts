import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, TreeItem, Uri, window } from 'vscode'
import { ExperimentsColumnsTree } from './columnsTree'
import complexColumnData from '../webview/complex-column-example.json'
import { ResourceLocator } from '../../resourceLocator'
import { Experiments } from '..'
import { ColumnData } from '../webview/contract'
import { ColumnStatus } from '../model'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedExperimentsColumnsChanged = mocked(new EventEmitter<void>())
const mockedExperimentsColumnsChangedFire = jest.fn()
mockedExperimentsColumnsChanged.fire = mockedExperimentsColumnsChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)

const mockedDisposable = mocked(Disposable)

const mockedGetChildColumns = jest.fn()
const mockedGetColumn = jest.fn()
const mockedGetDvcRoots = jest.fn()
const mockedExperiments = {
  experimentsColumnsChanged: mockedExperimentsColumnsChanged,
  getChildColumns: mockedGetChildColumns,
  getColumn: mockedGetColumn,
  getDvcRoots: mockedGetDvcRoots,
  isReady: () => true
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
    it('should return the experiments roots if no path is provided', async () => {
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

    it("should return the column's children if a path is provided", async () => {
      const experimentsColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const mockedDvcRoot = join('path', 'to', 'dvc', 'repo')
      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      await experimentsColumnsTree.getChildren()

      mockedGetChildColumns.mockReturnValueOnce(
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

      mockedGetChildColumns.mockReturnValueOnce(
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

      mockedGetChildColumns.mockReturnValueOnce(
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

    mockedGetColumn.mockReturnValueOnce({
      descendantMetadata: '3/4',
      hasChildren: true,
      status: ColumnStatus.selected
    } as unknown as ColumnData)

    const treeItem = experimentsColumnsTree.getTreeItem(paramsPath)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(mockedGetColumn).toBeCalledTimes(1)
    expect(mockedGetColumn).toBeCalledWith(mockedDvcRoot, relParamsPath)
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

    mockedGetColumn.mockReturnValueOnce({
      hasChildren: false,
      status: ColumnStatus.unselected
    } as unknown as ColumnData)

    const treeItem = experimentsColumnsTree.getTreeItem(paramsPath)

    expect(mockedTreeItem).toBeCalledTimes(1)
    expect(mockedGetColumn).toBeCalledTimes(1)
    expect(mockedGetColumn).toBeCalledWith(mockedDvcRoot, relParamsPath)
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
