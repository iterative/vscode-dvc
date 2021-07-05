import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, TreeItem, window } from 'vscode'
import { ExperimentsColumnsTree } from './columnsTree'
import complexColumnData from '../webview/complex-column-example.json'
import { ResourceLocator } from '../../resourceLocator'
import { Experiments } from '..'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedTreeDataChanged = mocked(new EventEmitter<string | void>())
const mockedTreeDataChangedFire = jest.fn()
mockedTreeDataChanged.fire = mockedTreeDataChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)

const mockedDisposable = mocked(Disposable)

const mockedGetColumns = jest.fn()
const mockedGetDvcRoots = jest.fn()
const mockedExperiments = {
  getColumns: mockedGetColumns,
  getDvcRoots: mockedGetDvcRoots
} as unknown as Experiments

const mockedResourceLocator = {
  selectedCheckbox: {
    dark: join('path', 'to', 'selected-checkbox.svg'),
    light: join('path', 'to', 'selected-checkbox.svg')
  },
  unselectedCheckbox: {
    dark: join('path', 'to', 'unselected-checkbox.svg'),
    light: join('path', 'to', 'unselected-checkbox.svg')
  }
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
    it('should return the experiments roots if no path is provided', () => {
      const experimentColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator,
        mockedTreeDataChanged
      )
      const mockedDvcRoots = [
        join('path', 'to', 'first', 'root'),
        join('path', 'to', 'second', 'root')
      ]

      mockedGetDvcRoots.mockReturnValueOnce(mockedDvcRoots)

      expect(experimentColumnsTree.getChildren()).toEqual(mockedDvcRoots)
    })

    it("should return the column's children if a path is provided", () => {
      const experimentColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator,
        mockedTreeDataChanged
      )

      const mockedDvcRoot = join('path', 'to', 'dvc', 'repo')
      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      experimentColumnsTree.getChildren()

      mockedGetColumns.mockReturnValueOnce(complexColumnData)

      const children = experimentColumnsTree.getChildren(mockedDvcRoot)
      const paramsPath = join(mockedDvcRoot, 'params', 'params.yaml')

      expect(children).toEqual([
        paramsPath,
        join(mockedDvcRoot, 'metrics', 'summary.json')
      ])

      mockedGetColumns.mockReturnValueOnce(complexColumnData)
      const grandChildren = experimentColumnsTree.getChildren(paramsPath)
      const paramsProcessPath = join(paramsPath, 'process')

      expect(grandChildren).toEqual([
        join(paramsPath, 'epochs'),
        join(paramsPath, 'learning_rate'),
        join(paramsPath, 'dvc_logs_dir'),
        join(paramsPath, 'log_file'),
        join(paramsPath, 'dropout'),
        paramsProcessPath
      ])

      mockedGetColumns.mockReturnValueOnce(complexColumnData)
      const greatGrandChildren =
        experimentColumnsTree.getChildren(paramsProcessPath)

      expect(greatGrandChildren).toEqual([
        join(paramsProcessPath, 'threshold'),
        join(paramsProcessPath, 'test_arg')
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

      const experimentColumnsTree = new ExperimentsColumnsTree(
        mockedExperiments,
        mockedResourceLocator,
        mockedTreeDataChanged
      )

      const mockedDvcRoot = join('dvc', 'repo')

      mockedGetDvcRoots.mockReturnValueOnce([mockedDvcRoot])

      experimentColumnsTree.getChildren()

      const treeItem = experimentColumnsTree.getTreeItem(mockedDvcRoot)

      expect(mockedTreeItem).toBeCalledTimes(1)
      expect(treeItem).toEqual({
        ...mockedItem
      })
    })
  })
})
