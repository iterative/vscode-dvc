import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { commands, ThemeIcon, TreeItem, Uri, window } from 'vscode'
import { ExperimentsTree } from './tree'
import { buildMockedExperiments } from '../../test/util/jest'
import { ResourceLocator } from '../../resourceLocator'

const mockedCommands = mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedWindow = mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedTreeItem = mocked(TreeItem)
const mockedThemeIcon = mocked(ThemeIcon)

const mockedDisposable = mocked(Disposable)

const {
  mockedExperiments,
  mockedGetDvcRoots,
  mockedGetExperiments,
  mockedGetCheckpoints
} = buildMockedExperiments()

const mockedGetExperimentsResource = jest.fn()
const mockedResourceLocator = {
  getExperimentsResource: mockedGetExperimentsResource
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

describe('ExperimentsTree', () => {
  describe('getChildren', () => {
    it('should return an empty array when no experiments exist for any of the multiple repositories', async () => {
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo', 'second/repo'])
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([])

      const rootElements = await experimentsTree.getChildren()

      expect(rootElements).toEqual([])
    })

    it('should return an empty array when no experiments exist for the single repository', async () => {
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      mockedGetExperiments.mockReturnValueOnce([])

      const rootElements = await experimentsTree.getChildren()

      expect(rootElements).toEqual([])
    })

    it('should return an array of root elements when at least one experiment exists in one of the repositories', async () => {
      const dvcRoots = ['demo', 'and/mock', 'other/repo']
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([{ displayName: '90aea7f' }])

      const rootElements = await experimentsTree.getChildren()

      expect(rootElements).toEqual(dvcRoots)
    })

    it('should return an array of experiment items when only a single repository is available', async () => {
      mockedThemeIcon.mockImplementation(function (id) {
        return { id }
      })

      const getMockedUri = (name: string, color: string) =>
        Uri.file(join('path', 'to', 'resources', `${name}-${color}.svg`))

      mockedGetExperimentsResource.mockImplementation(getMockedUri)

      const experiments = [
        {
          displayColor: '#b180d7',
          displayName: '90aea7f',
          hasChildren: true,
          id: '90aea7f'
        },
        {
          displayColor: '#1a1c19',
          displayName: 'f0778b3',
          hasChildren: false,
          id: 'f0778b3',
          running: true
        },
        {
          displayName: 'f81f1b5',
          hasChildren: false,
          id: 'f81f1b5',
          queued: true
        }
      ]
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      mockedGetExperiments
        .mockReturnValueOnce(experiments)
        .mockReturnValueOnce(experiments)

      mockedGetDvcRoots.mockReturnValueOnce(['repo'])

      const children = await experimentsTree.getChildren()

      expect(children).toEqual([
        {
          collapsibleState: 1,
          dvcRoot: 'repo',
          iconPath: getMockedUri('circle-filled', '#b180d7'),
          id: '90aea7f',
          label: '90aea7f'
        },
        {
          collapsibleState: 0,
          dvcRoot: 'repo',
          iconPath: getMockedUri('loading-spin', '#1a1c19'),
          id: 'f0778b3',
          label: 'f0778b3'
        },
        {
          collapsibleState: 0,
          dvcRoot: 'repo',
          iconPath: new ThemeIcon('watch'),
          id: 'f81f1b5',
          label: 'f81f1b5'
        }
      ])
    })

    it('should return an array of checkpoint items when a non root element is provided', async () => {
      mockedThemeIcon.mockImplementation(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const checkpoints = [
        { displayName: 'aaaaaaa', id: 'aaaaaaaaaaaaaaaaa' },
        { displayName: 'bbbbbbb', id: 'bbbbbbbbbbbbbbbbb' }
      ]
      mockedGetCheckpoints.mockReturnValueOnce(checkpoints)

      const children = await experimentsTree.getChildren({
        collapsibleState: 1,
        dvcRoot: 'repo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'ebbd66f',
        label: 'ebbd66f'
      })

      expect(children).toEqual([
        {
          collapsibleState: 0,
          dvcRoot: 'repo',
          iconPath: new ThemeIcon('debug-stackframe-dot'),
          id: 'aaaaaaaaaaaaaaaaa',
          label: 'aaaaaaa'
        },
        {
          collapsibleState: 0,
          dvcRoot: 'repo',
          iconPath: new ThemeIcon('debug-stackframe-dot'),
          id: 'bbbbbbbbbbbbbbbbb',
          label: 'bbbbbbb'
        }
      ])
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

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo', 'other'])
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([])

      await experimentsTree.getChildren()

      const treeItem = experimentsTree.getTreeItem('demo')
      expect(treeItem).toEqual({ ...mockedItem })
    })

    it('should return a tree item for a queued experiment', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toEqual(0)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('watch'),
        id: 'f0778b3',
        label: 'f0778b3'
      })
      expect(treeItem).toEqual({ ...mockedItem, iconPath: { id: 'watch' } })
    })

    it('should return a tree item for the workspace (running experiment)', () => {
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

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'workspace',
        label: 'workspace'
      })

      expect(treeItem).toEqual({
        ...mockedItem,
        iconPath: { id: 'loading~spin' }
      })
    })

    it('should return a tree item for a running experiment', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toEqual(1)
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 1,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'f0778b3',
        label: 'f0778b3'
      })

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

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('debug-stackframe-dot'),
        id: 'f0778b3',
        label: 'f0778b3'
      })
      expect(treeItem).toEqual({
        ...mockedItem,
        iconPath: { id: 'debug-stackframe-dot' }
      })
    })

    it('should return a tree item for an existing experiment', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 1,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('circle-filled'),
        id: 'f0998a3',
        label: 'f0998a3'
      })

      expect(treeItem).toEqual({
        ...mockedItem,
        iconPath: { id: 'circle-filled' }
      })
    })
  })
})
