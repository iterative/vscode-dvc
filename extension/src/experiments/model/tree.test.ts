import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { commands, ThemeIcon, TreeItem, Uri, window } from 'vscode'
import { ExperimentType } from '.'
import { ExperimentsTree } from './tree'
import { buildMockedExperiments } from '../../test/util/jest'
import { ResourceLocator } from '../../resourceLocator'
import { InternalCommands } from '../../commands/internal'
import { RegisteredCommands } from '../../commands/external'

const mockedCommands = jest.mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedCreateTreeView = jest.fn()
mockedWindow.createTreeView = mockedCreateTreeView
const mockedTreeItem = jest.mocked(TreeItem)
const mockedThemeIcon = jest.mocked(ThemeIcon)

const mockedDisposable = jest.mocked(Disposable)

const {
  mockedExperiments,
  mockedGetDvcRoots,
  mockedGetExperiments,
  mockedGetCheckpoints
} = buildMockedExperiments()

const mockedClockResource = {
  dark: Uri.file(join('some', 'light', 'clock')),
  light: Uri.file(join('some', 'dark', 'clock'))
}

const mockedGetExperimentsResource = jest.fn()
const mockedResourceLocator = {
  clock: mockedClockResource,
  getExperimentsResource: mockedGetExperimentsResource
} as unknown as ResourceLocator

const mockedInternalCommands = {
  registerExternalCommand: jest.fn()
} as unknown as InternalCommands

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

beforeEach(() => {
  jest.resetAllMocks()
  mockedCreateTreeView.mockReturnValueOnce({
    onDidCollapseElement: jest.fn(),
    onDidExpandElement: jest.fn()
  })
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
        mockedInternalCommands,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo', 'second/repo'])
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([])

      const rootElements = await experimentsTree.getChildren()

      expect(rootElements).toStrictEqual([])
    })

    it('should return an empty array when no experiments exist for the single repository', async () => {
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])
      mockedGetExperiments.mockReturnValueOnce([])

      const rootElements = await experimentsTree.getChildren()

      expect(rootElements).toStrictEqual([])
    })

    it('should return an array of root elements when at least one experiment exists in one of the repositories', async () => {
      const dvcRoots = ['demo', 'and/mock', 'other/repo']
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(dvcRoots)
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([
        { label: 'workspace' },
        { label: 'main' },
        { label: '90aea7f' }
      ])

      const rootElements = await experimentsTree.getChildren()

      expect(rootElements).toStrictEqual(dvcRoots)
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
          hasChildren: true,
          id: 'exp-12345',
          label: '90aea7f',
          selected: true,
          type: ExperimentType.EXPERIMENT
        },
        {
          displayColor: '#1a1c19',
          hasChildren: false,
          id: 'exp-67899',
          label: 'f0778b3',
          running: true,
          selected: true,
          type: ExperimentType.EXPERIMENT
        },
        {
          displayColor: '#4063e2',
          hasChildren: false,
          id: 'exp-abcdef',
          label: 'e350702',
          running: false,
          selected: false,
          type: ExperimentType.EXPERIMENT
        },
        {
          hasChildren: false,
          id: 'f81f1b5',
          label: 'f81f1b5',
          queued: true,
          type: ExperimentType.QUEUED
        }
      ]
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )
      mockedGetExperiments
        .mockReturnValueOnce(experiments)
        .mockReturnValueOnce(experiments)

      mockedGetDvcRoots.mockReturnValueOnce(['repo'])

      const children = await experimentsTree.getChildren()

      expect(children).toStrictEqual([
        {
          collapsibleState: 1,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'exp-12345' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: getMockedUri('circle-filled', '#b180d7'),
          id: 'exp-12345',
          label: '90aea7f',
          type: ExperimentType.EXPERIMENT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'exp-67899' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: getMockedUri('loading-spin', '#1a1c19'),
          id: 'exp-67899',
          label: 'f0778b3',
          type: ExperimentType.EXPERIMENT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'exp-abcdef' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: getMockedUri('circle-outline', '#4063e2'),
          id: 'exp-abcdef',
          label: 'e350702',
          type: ExperimentType.EXPERIMENT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'f81f1b5' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: mockedClockResource,
          id: 'f81f1b5',
          label: 'f81f1b5',
          type: ExperimentType.QUEUED
        }
      ])
    })

    it('should return an array of checkpoint items when a non root element is provided', async () => {
      mockedThemeIcon.mockImplementation(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )

      const checkpoints = [
        {
          id: 'aaaaaaaaaaaaaaaaa',
          label: 'aaaaaaa',
          type: ExperimentType.CHECKPOINT
        },
        {
          id: 'bbbbbbbbbbbbbbbbb',
          label: 'bbbbbbb',
          type: ExperimentType.CHECKPOINT
        }
      ]
      mockedGetCheckpoints.mockReturnValueOnce(checkpoints)

      const children = await experimentsTree.getChildren({
        collapsibleState: 1,
        description: undefined,
        dvcRoot: 'repo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'ebbd66f',
        label: 'ebbd66f',
        type: ExperimentType.EXPERIMENT
      })

      expect(children).toStrictEqual([
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'aaaaaaaaaaaaaaaaa' }],
            command: 'dvc.views.experimentsTree.toggleStatus',
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: new ThemeIcon('circle-filled'),
          id: 'aaaaaaaaaaaaaaaaa',
          label: 'aaaaaaa',
          type: ExperimentType.CHECKPOINT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'bbbbbbbbbbbbbbbbb' }],
            command: 'dvc.views.experimentsTree.toggleStatus',
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: new ThemeIcon('circle-filled'),
          id: 'bbbbbbbbbbbbbbbbb',
          label: 'bbbbbbb',
          type: ExperimentType.CHECKPOINT
        }
      ])
    })
  })

  describe('getTreeItem', () => {
    it('should return a tree item for a root element', async () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toStrictEqual(2)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo', 'other'])
      mockedGetExperiments.mockReturnValueOnce([])
      mockedGetExperiments.mockReturnValueOnce([])

      await experimentsTree.getChildren()

      const treeItem = experimentsTree.getTreeItem('demo')
      expect(treeItem).toStrictEqual({ ...mockedItem })
    })

    it('should return a tree item for a queued experiment', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
        expect(collapsibleState).toStrictEqual(0)
        mockedItem = { collapsibleState, uri }
        return mockedItem
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: mockedClockResource,
        id: 'f0778b3',
        label: 'f0778b3',
        type: ExperimentType.QUEUED
      })
      expect(treeItem).toStrictEqual(mockedItem)
    })

    it('should return a tree item for the workspace', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toStrictEqual(0)
        expect(label).toStrictEqual('workspace')
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'workspace',
        label: 'workspace',
        type: ExperimentType.WORKSPACE
      })

      expect(treeItem).toStrictEqual({
        ...mockedItem,
        iconPath: { id: 'loading~spin' }
      })
    })

    it('should return a tree item for a running experiment', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toStrictEqual(1)
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 1,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'f0778b3',
        label: 'f0778b3',
        type: ExperimentType.EXPERIMENT
      })

      expect(treeItem).toStrictEqual({
        ...mockedItem,
        iconPath: { id: 'loading~spin' }
      })
    })

    it("should return a tree item for an experiment's checkpoint", () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (label, collapsibleState) {
        expect(collapsibleState).toStrictEqual(0)
        mockedItem = { collapsibleState, label }
        return mockedItem
      })
      mockedThemeIcon.mockImplementationOnce(function (id) {
        return { id }
      })

      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedInternalCommands,
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('circle-filled'),
        id: 'f0778b3',
        label: 'f0778b3',
        type: ExperimentType.EXPERIMENT
      })
      expect(treeItem).toStrictEqual({
        ...mockedItem,
        iconPath: { id: 'circle-filled' }
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
        mockedInternalCommands,
        mockedResourceLocator
      )
      mockedGetDvcRoots.mockReturnValueOnce(['demo'])

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 1,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('circle-filled'),
        id: 'f0998a3',
        label: 'f0998a3',
        type: ExperimentType.EXPERIMENT
      })

      expect(treeItem).toStrictEqual({
        ...mockedItem,
        iconPath: { id: 'circle-filled' }
      })
    })
  })
})
