import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, EventEmitter, ThemeIcon, TreeItem, window } from 'vscode'
import { ExperimentsRunsTree } from './runsTree'
import { Experiments } from '..'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedExperimentsRowsChanged = mocked(new EventEmitter<string | void>())
const mockedExperimentDataChangedFire = jest.fn()
mockedExperimentsRowsChanged.fire = mockedExperimentDataChangedFire
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)
const mockedThemeIcon = mocked(ThemeIcon)

const mockedDisposable = mocked(Disposable)

const mockedGetDvcRoots = jest.fn()
const mockedGetExperiment = jest.fn()
const mockedGetCheckpointNames = jest.fn()
const mockedGetExperimentNames = jest.fn()
const mockedExperiments = {
  experimentsRowsChanged: mockedExperimentsRowsChanged,
  getCheckpointNames: mockedGetCheckpointNames,
  getDvcRoots: mockedGetDvcRoots,
  getExperiment: mockedGetExperiment,
  getExperimentNames: mockedGetExperimentNames,
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

describe('ExperimentsRunsTree', () => {
  describe('getChildren', () => {
    it('should return an empty array when no experiments exist for any of the multiple repositories', async () => {
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo', 'second/repo'])
      mockedGetExperimentNames.mockReturnValueOnce([])
      mockedGetExperimentNames.mockReturnValueOnce([])

      const rootElements = await experimentsRunsTree.getChildren()

      expect(rootElements).toEqual([])
    })

    it('should return an empty array when no experiments exist for the single repository', async () => {
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      mockedGetExperimentNames.mockReturnValueOnce([])

      const rootElements = await experimentsRunsTree.getChildren()

      expect(rootElements).toEqual([])
    })

    it('should return an array of root elements when at least one experiment exists in one of the repositories', async () => {
      const dvcRoots = ['demo', 'and/mock', 'other/repo']
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
      mockedGetExperimentNames.mockReturnValueOnce([])
      mockedGetExperimentNames.mockReturnValueOnce([])
      mockedGetExperimentNames.mockReturnValueOnce(['90aea7f'])

      const rootElements = await experimentsRunsTree.getChildren()

      expect(rootElements).toEqual(dvcRoots)
    })

    it('should return an array of existing experiment names when only a single repository is available', async () => {
      const existingExperiments = ['90aea7f', 'f0778b3', 'f81f1b5']
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetExperimentNames.mockReturnValueOnce(existingExperiments)
      mockedGetExperimentNames.mockReturnValueOnce(existingExperiments)

      mockedGetDvcRoots.mockReturnValueOnce(['repo'])

      const children = await experimentsRunsTree.getChildren()

      expect(children).toEqual(existingExperiments)
    })

    it('should return an array of checkpoints when a non root element is provided', async () => {
      const experimentNames = ['ebbd66f', 'e5855d7', '6e5e782', '15c9c56']
      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetExperimentNames.mockReturnValueOnce(experimentNames)
      mockedGetExperimentNames.mockReturnValueOnce(experimentNames)

      mockedGetDvcRoots.mockReturnValueOnce(['repo'])
      await experimentsRunsTree.getChildren()

      const checkpoints = ['aaaaaaa', 'bbbbbbb']
      mockedGetCheckpointNames.mockReturnValueOnce(checkpoints)

      const children = await experimentsRunsTree.getChildren('ebbd66f')

      expect(children).toEqual(checkpoints)
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
      mockedGetDvcRoots.mockReturnValueOnce(['demo', 'other'])
      mockedGetExperimentNames.mockReturnValueOnce([])
      mockedGetExperimentNames.mockReturnValueOnce([])

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
      const mockedQueuedExperiment = 'f0778b3'
      mockedGetExperimentNames.mockReturnValueOnce([mockedQueuedExperiment])
      mockedGetExperimentNames.mockReturnValueOnce([mockedQueuedExperiment])
      mockedGetExperiment.mockReturnValueOnce({
        queued: true,
        running: false
      })

      await experimentsRunsTree.getChildren()

      const treeItem = experimentsRunsTree.getTreeItem(mockedQueuedExperiment)
      expect(treeItem).toEqual({ ...mockedItem, iconPath: { id: 'watch' } })
    })

    it('should return a tree item for the workspace (running experiment)', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        expect(label).toEqual('workspace')
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      const mockedRunningExperiment = 'workspace'
      mockedGetExperimentNames.mockReturnValueOnce([mockedRunningExperiment])
      mockedGetExperimentNames.mockReturnValueOnce([mockedRunningExperiment])

      await experimentsRunsTree.getChildren()

      const treeItem = experimentsRunsTree.getTreeItem(mockedRunningExperiment)
      expect(treeItem).toEqual({
        ...mockedItem,
        iconPath: { id: 'loading~spin' }
      })
    })

    it('should return a tree item for a running experiment', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      const mockedRunningExperiment = 'f0778b3'
      mockedGetExperimentNames.mockReturnValueOnce([mockedRunningExperiment])
      mockedGetExperimentNames.mockReturnValueOnce([mockedRunningExperiment])
      mockedGetExperiment.mockReturnValueOnce({
        hasChildren: true,
        running: true
      })

      await experimentsRunsTree.getChildren()

      const treeItem = experimentsRunsTree.getTreeItem(mockedRunningExperiment)
      expect(treeItem).toEqual({
        ...mockedItem,
        iconPath: { id: 'loading~spin' }
      })
    })

    it("should return a tree item for an experiment's checkpoint", () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)

      const treeItem = experimentsRunsTree.getTreeItem('f0778b3')
      expect(treeItem).toEqual({
        ...mockedItem,
        iconPath: { id: 'debug-stackframe-dot' }
      })
    })

    it('should return a tree item for an existing experiment', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsRunsTree = new ExperimentsRunsTree(mockedExperiments)
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      const mockedExistingExperiment = 'f0998a3'
      mockedGetExperimentNames.mockReturnValueOnce([mockedExistingExperiment])
      mockedGetExperimentNames.mockReturnValueOnce([mockedExistingExperiment])
      mockedGetExperiment.mockReturnValueOnce({})

      await experimentsRunsTree.getChildren()

      const treeItem = experimentsRunsTree.getTreeItem(mockedExistingExperiment)
      expect(treeItem).toEqual({
        ...mockedItem,
        iconPath: { id: 'primitive-dot' }
      })
    })
  })
})
