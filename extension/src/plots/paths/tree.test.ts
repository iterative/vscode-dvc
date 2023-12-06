import { MarkdownString, TreeItem, Uri } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { EncodingType } from './collect'
import { PlotsPathsTree } from './tree'
import { WorkspacePlots } from '../workspace'
import { ResourceLocator } from '../../resourceLocator'
import { InternalCommands } from '../../commands/internal'
import { Plots } from '..'
import { buildMockedEventEmitter } from '../../test/util/jest'
import { join } from '../../test/util/path'
import { DecoratableTreeItemScheme, getDecoratableUri } from '../../tree'
import { RegisteredCommands } from '../../commands/external'
import { getMarkdownString } from '../../vscode/markdownString'
import { PLOT_SHAPE, PLOT_STROKE_DASH } from '../../cli/dvc/contract'

const mockedDisposable = jest.mocked(Disposable)
const mockedGetChildPaths = jest.fn()
const mockedWorkspacePlots = {
  getRepository: () =>
    ({ getChildPaths: mockedGetChildPaths }) as unknown as Plots,
  pathsChanged: buildMockedEventEmitter()
} as unknown as WorkspacePlots
const mockedInternalCommands = {
  registerExternalCommand: jest.fn()
} as unknown as InternalCommands
const resourceLocator = new ResourceLocator(Uri.file(__filename))
const mockedTreeItem = jest.mocked(TreeItem)
const mockedGetMarkdownString = jest.mocked(getMarkdownString)

jest.mock('vscode')
jest.mock('../../vscode/markdownString')
jest.mock('@hediet/std/disposable')

beforeEach(() => {
  jest.resetAllMocks()
  mockedDisposable.fn.mockReturnValue({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('PlotsPathsTree', () => {
  it('should return the correct children for multi source plots (encoding elements)', () => {
    const plotsPathTree = new PlotsPathsTree(
      mockedWorkspacePlots,
      mockedInternalCommands,
      resourceLocator
    )

    mockedGetChildPaths.mockReturnValueOnce([
      {
        label: 'A',
        type: EncodingType.STROKE_DASH,
        value: PLOT_STROKE_DASH[0]
      },
      {
        label: 'Y',
        type: EncodingType.SHAPE,
        value: PLOT_SHAPE[1]
      }
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children = (plotsPathTree as any).getRepositoryChildren(
      __dirname,
      undefined
    )
    expect(children).toStrictEqual([
      {
        collapsibleState: 0,
        description: undefined,
        dvcRoot: __dirname,
        iconPath: Uri.file(
          join(__filename, 'resources', 'plots', 'stroke-dash-1-0.svg')
        ),
        label: 'A',
        path: 'A',
        tooltip: undefined
      },
      {
        collapsibleState: 0,
        description: undefined,
        dvcRoot: __dirname,
        iconPath: Uri.file(
          join(__filename, 'resources', 'plots', 'circle.svg')
        ),
        label: 'Y',
        path: 'Y',
        tooltip: undefined
      }
    ])
  })

  it('should return the correct tree item for a cli error', () => {
    const errorMsg = 'dvc cli error message'
    const path = join('plots', 'plot.png')
    const expectedUri = getDecoratableUri(path, DecoratableTreeItemScheme.PLOTS)
    const expectedCollapsibleState = 0

    mockedGetMarkdownString.mockImplementationOnce(
      str => str as unknown as MarkdownString
    )
    mockedTreeItem.mockImplementationOnce(function (uri, collapsibleState) {
      expect(collapsibleState).toStrictEqual(expectedCollapsibleState)
      expect(uri).toStrictEqual(expectedUri)
      return { collapsibleState, uri }
    })

    const plotsPathTree = new PlotsPathsTree(
      mockedWorkspacePlots,
      mockedInternalCommands,
      resourceLocator
    )

    const treeItem = plotsPathTree.getTreeItem({
      error: errorMsg,
      path
    })

    expect(treeItem).toStrictEqual({
      collapsibleState: expectedCollapsibleState,
      command: {
        command: RegisteredCommands.EXTENSION_SHOW_OUTPUT,
        title: 'Show DVC Output'
      },
      contextValue: 'cliError',
      iconPath: expect.anything(),
      tooltip: `$(error) ${errorMsg}`,
      uri: expectedUri
    })
  })
})
