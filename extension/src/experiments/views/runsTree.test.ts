import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, ThemeIcon, TreeItem, window } from 'vscode'
import { ExperimentsRunsTree } from './runsTree'
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
const mockedThemeIcon = mocked(ThemeIcon)

const mockedDisposable = mocked(Disposable)

const mockedGetDvcRoots = jest.fn()
const mockedGetQueuedExperiments = jest.fn()
const mockedExperiments = {
  getDvcRoots: mockedGetDvcRoots,
  getQueuedExperiments: mockedGetQueuedExperiments,
  isReady: () => true,
  onDidChangeExperimentsData: jest.fn()
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

describe('ExperimentsRunsTree', () => {
  describe('getChildren', () => {
    it('should return an empty array when no experiments are queued for any of the repositories', async () => {
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      mockedGetQueuedExperiments.mockReturnValueOnce([])

      const rootElements = await experimentsRunsTree.getChildren()

      expect(rootElements).toEqual([])
    })

    it('should return an array of root elements when at least one experiments is queued in one of the repositories', async () => {
      const dvcRoots = ['demo', 'and/mock', 'other/repo']
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
      mockedGetQueuedExperiments.mockReturnValueOnce([])
      mockedGetQueuedExperiments.mockReturnValueOnce([])
      mockedGetQueuedExperiments.mockReturnValueOnce(['90aea7f'])

      const rootElements = await experimentsRunsTree.getChildren()

      expect(rootElements).toEqual(dvcRoots)
    })

    it('should return an array of queued experiment names when an element is provided', async () => {
      const queuedExperiments = ['90aea7f', 'f0778b3', 'f81f1b5']
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetQueuedExperiments.mockReturnValueOnce(queuedExperiments)

      const rootElements = await experimentsRunsTree.getChildren('repo')

      expect(rootElements).toEqual(queuedExperiments)
    })
  })

  describe('getTreeItem', () => {
    it('should return a tree item for a root element', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      mockedGetQueuedExperiments.mockReturnValueOnce([])

      await experimentsRunsTree.getChildren()

      const treeItem = experimentsRunsTree.getTreeItem('demo')
      expect(treeItem).toEqual({ ...mockedItem })
    })

    it('should return a tree item for a queued experiment', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      mockedGetQueuedExperiments.mockReturnValueOnce(['f0778b3'])
      mockedGetQueuedExperiments.mockReturnValueOnce(['f0778b3'])

      await experimentsRunsTree.getChildren()
      await experimentsRunsTree.getChildren('demo')

      const treeItem = experimentsRunsTree.getTreeItem('f0778b3')
      expect(treeItem).toEqual({ ...mockedItem, iconPath: { id: 'watch' } })
    })
  })
})
