import { join } from 'path'
import { Disposable, Disposer } from '@hediet/std/disposable'
import {
  commands,
  MarkdownString,
  ThemeIcon,
  TreeItem,
  Uri,
  window
} from 'vscode'
import { ExperimentType } from '.'
import { ExperimentsTree } from './tree'
import { buildMockedExperiments } from '../../test/util/jest'
import { ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { getMarkdownString } from '../../vscode/markdownString'
import { DecoratableTreeItemScheme, getDecoratableUri } from '../../tree'
import { ExperimentStatus } from '../webview/contract'

const mockedCommands = jest.mocked(commands)
mockedCommands.registerCommand = jest.fn()
const mockedWindow = jest.mocked(window)
mockedWindow.registerTreeDataProvider = jest.fn()
const mockedCreateTreeView = jest.fn()
mockedWindow.createTreeView = mockedCreateTreeView
const mockedTreeItem = jest.mocked(TreeItem)
const mockedThemeIcon = jest.mocked(ThemeIcon)

const mockedDisposable = jest.mocked(Disposable)

const mockedGetMarkdownString = jest.mocked(getMarkdownString)

const {
  mockedExperiments,
  mockedGetDvcRoots,
  mockedGetExperiments,
  mockedGetBranchExperiments,
  mockedGetCheckpoints,
  mockedGetFirstThreeColumnOrder
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

jest.mock('vscode')
jest.mock('../../vscode/markdownString')
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
      mockedGetMarkdownString.mockImplementationOnce(
        str => str as unknown as MarkdownString
      )

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
          selected: true,
          status: ExperimentStatus.RUNNING,
          type: ExperimentType.EXPERIMENT
        },
        {
          displayColor: undefined,
          hasChildren: false,
          id: 'exp-abcdef',
          label: 'e350702',
          selected: false,
          type: ExperimentType.EXPERIMENT
        },
        {
          displayColor: undefined,
          error:
            "unable to read: 'params.yaml', YAML file structure is corrupted",
          hasChildren: false,
          id: '139eabc',
          label: '139eabc',
          selected: false,
          type: ExperimentType.EXPERIMENT
        },
        {
          hasChildren: false,
          id: 'f81f1b5',
          label: 'f81f1b5',
          status: ExperimentStatus.QUEUED,
          type: ExperimentType.QUEUED
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
      mockedGetFirstThreeColumnOrder.mockReturnValue([])

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
          tooltip: undefined,
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
          tooltip: undefined,
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
          iconPath: { id: 'circle-outline' },
          id: 'exp-abcdef',
          label: 'e350702',
          tooltip: undefined,
          type: ExperimentType.EXPERIMENT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: '139eabc' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: { id: 'circle-outline' },
          id: '139eabc',
          label: '139eabc',
          tooltip:
            "$(error) unable to read: 'params.yaml', YAML file structure is corrupted",
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
          tooltip: undefined,
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
        mockedResourceLocator
      )

      const checkpoints = [
        {
          id: 'aaaaaaaaaaaaaaaaa',
          label: 'aaaaaaa',
          tooltip: undefined,
          type: ExperimentType.CHECKPOINT
        },
        {
          id: 'bbbbbbbbbbbbbbbbb',
          label: 'bbbbbbb',
          tooltip: undefined,
          type: ExperimentType.CHECKPOINT
        }
      ]
      mockedGetCheckpoints.mockReturnValueOnce(checkpoints)
      mockedGetFirstThreeColumnOrder.mockReturnValue([])

      const children = await experimentsTree.getChildren({
        collapsibleState: 1,
        description: undefined,
        dvcRoot: 'repo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'ebbd66f',
        label: 'ebbd66f',
        tooltip: undefined,
        type: ExperimentType.EXPERIMENT
      })

      expect(children).toStrictEqual([
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'aaaaaaaaaaaaaaaaa' }],
            command: 'dvc.views.experiments.toggleStatus',
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: new ThemeIcon('circle-filled'),
          id: 'aaaaaaaaaaaaaaaaa',
          label: 'aaaaaaa',
          tooltip: undefined,
          type: ExperimentType.CHECKPOINT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'bbbbbbbbbbbbbbbbb' }],
            command: 'dvc.views.experiments.toggleStatus',
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: new ThemeIcon('circle-filled'),
          id: 'bbbbbbbbbbbbbbbbb',
          label: 'bbbbbbb',
          tooltip: undefined,
          type: ExperimentType.CHECKPOINT
        }
      ])
    })

    it('should return the branch experiments when the element is a branch', async () => {
      const experimentsTree = new ExperimentsTree(
        mockedExperiments,
        mockedResourceLocator
      )
      const getMockedUri = (name: string, color: string) =>
        Uri.file(join('path', 'to', 'resources', `${name}-${color}.svg`))
      const dvcRoot = '/dvc-root'
      const branch = {
        collapsibleState: 0,
        description: 'f81f1b5',
        dvcRoot,
        hasChildren: true,
        iconPath: getMockedUri('circle-filled', '#b180d7'),
        id: 'f81f1b5',
        label: 'f81f1b5',
        tooltip: undefined,
        type: ExperimentType.BRANCH
      }

      const experimentsByBranch = [
        {
          displayColor: undefined,
          hasChildren: false,
          id: 'exp-abcdef',
          label: 'e350702',
          selected: false,
          type: ExperimentType.EXPERIMENT
        }
      ]
      mockedGetBranchExperiments.mockReturnValueOnce(experimentsByBranch)
      mockedGetFirstThreeColumnOrder.mockReturnValue([])

      const children = await experimentsTree.getChildren(branch)

      expect(children).toStrictEqual([
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot, id: 'exp-abcdef' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot,
          iconPath: expect.anything(),
          id: 'exp-abcdef',
          label: 'e350702',
          tooltip: undefined,
          type: ExperimentType.EXPERIMENT
        }
      ])
    })
    it('should return experiments with markdown table tooltips', async () => {
      mockedGetMarkdownString.mockImplementation(
        str => str as unknown as MarkdownString
      )

      const experiments = [
        {
          Created: '2022-08-19T08:17:22',
          deps: {
            'data/data.xml': { changes: false, value: '22a1a29' }
          },
          displayColor: undefined,
          hasChildren: true,
          id: 'exp-123',
          label: 'a123',
          params: {
            'params.yaml': {
              featurize: { max_features: 200 }
            }
          },
          selected: false,
          type: ExperimentType.EXPERIMENT
        },
        {
          Created: '2022-09-15T06:58:29',
          deps: {
            'data/data.xml': { changes: false, value: '22a1a29' }
          },
          displayColor: undefined,
          hasChildren: false,
          id: 'exp-456',
          label: 'b456',
          params: {
            'params.yaml': {
              featurize: { max_features: 210 }
            }
          },
          selected: true,
          type: ExperimentType.EXPERIMENT
        },
        {
          Created: '2022-07-03T05:10:10',
          deps: {
            'data/data.xml': { changes: false, value: '22a1a29' }
          },
          displayColor: undefined,
          hasChildren: false,
          id: 'exp-789',
          label: 'c789',
          params: {
            'params.yaml': {
              featurize: { max_features: 190 }
            }
          },
          selected: false,
          type: ExperimentType.EXPERIMENT
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
      mockedGetFirstThreeColumnOrder.mockReturnValue([
        'Created',
        'params:params.yaml:featurize.max_features',
        'deps:data/data.xml'
      ])

      const children = await experimentsTree.getChildren()

      expect(children).toStrictEqual([
        {
          collapsibleState: 1,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'exp-123' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: expect.anything(),
          id: 'exp-123',
          label: 'a123',
          tooltip:
            '|||\n|:--|--|\n| Created | Aug 19, 2022 |\n| params.yaml:featurize.max_features | 200 |\n| data/data.xml | 22a1a29 |\n',
          type: ExperimentType.EXPERIMENT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'exp-456' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: expect.anything(),
          id: 'exp-456',
          label: 'b456',
          tooltip:
            '|||\n|:--|--|\n| Created | Sep 15, 2022 |\n| params.yaml:featurize.max_features | 210 |\n| data/data.xml | 22a1a29 |\n',
          type: ExperimentType.EXPERIMENT
        },
        {
          collapsibleState: 0,
          command: {
            arguments: [{ dvcRoot: 'repo', id: 'exp-789' }],
            command: RegisteredCommands.EXPERIMENT_TOGGLE,
            title: 'toggle'
          },
          description: undefined,
          dvcRoot: 'repo',
          iconPath: expect.anything(),
          id: 'exp-789',
          label: 'c789',
          tooltip:
            '|||\n|:--|--|\n| Created | Jul 3, 2022 |\n| params.yaml:featurize.max_features | 190 |\n| data/data.xml | 22a1a29 |\n',
          type: ExperimentType.EXPERIMENT
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
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: mockedClockResource,
        id: 'f0778b3',
        label: 'f0778b3',
        tooltip: undefined,
        type: ExperimentType.QUEUED
      })
      expect(treeItem).toStrictEqual(mockedItem)
    })

    it('should return a tree item for the workspace', () => {
      let mockedItem = {}
      mockedTreeItem.mockImplementationOnce(function (
        resourceUri,
        collapsibleState
      ) {
        expect(collapsibleState).toStrictEqual(0)
        expect(resourceUri).toStrictEqual(
          getDecoratableUri('workspace', DecoratableTreeItemScheme.EXPERIMENTS)
        )
        mockedItem = { collapsibleState, resourceUri }
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
        description: undefined,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'workspace',
        label: 'workspace',
        tooltip: undefined,
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
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 1,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('loading~spin'),
        id: 'f0778b3',
        label: 'f0778b3',
        tooltip: undefined,
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
        mockedResourceLocator
      )

      const treeItem = experimentsTree.getTreeItem({
        collapsibleState: 0,
        description: undefined,
        dvcRoot: 'demo',
        iconPath: new ThemeIcon('circle-filled'),
        id: 'f0778b3',
        label: 'f0778b3',
        tooltip: undefined,
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
        tooltip: undefined,
        type: ExperimentType.EXPERIMENT
      })

      expect(treeItem).toStrictEqual({
        ...mockedItem,
        iconPath: { id: 'circle-filled' }
      })
    })
  })
})
