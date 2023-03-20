import { Uri } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { EncodingType } from './collect'
import { PlotsPathsTree } from './tree'
import { WorkspacePlots } from '../workspace'
import { ResourceLocator } from '../../resourceLocator'
import { InternalCommands } from '../../commands/internal'
import { Plots } from '..'
import { buildMockedEventEmitter } from '../../test/util/jest'
import { Shape, StrokeDash } from '../multiSource/constants'
import { join } from '../../test/util/path'

const mockedDisposable = jest.mocked(Disposable)
const mockedGetChildPaths = jest.fn()

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

describe('PlotsPathsTree', () => {
  it('should return the correct children for multi source plots (encoding elements)', () => {
    const mockedWorkspacePlots = {
      getRepository: () =>
        ({ getChildPaths: mockedGetChildPaths } as unknown as Plots),
      pathsChanged: buildMockedEventEmitter()
    } as unknown as WorkspacePlots
    const mockedInternalCommands = {
      registerExternalCommand: jest.fn()
    } as unknown as InternalCommands
    const resourceLocator = new ResourceLocator(Uri.file(__filename))

    const plotsPathTree = new PlotsPathsTree(
      mockedWorkspacePlots,
      mockedInternalCommands,
      resourceLocator
    )

    mockedGetChildPaths.mockReturnValueOnce([
      {
        label: 'A',
        type: EncodingType.STROKE_DASH,
        value: StrokeDash[0]
      },
      {
        label: 'Y',
        type: EncodingType.SHAPE,
        value: Shape[1]
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
        path: 'A'
      },
      {
        collapsibleState: 0,
        description: undefined,
        dvcRoot: __dirname,
        iconPath: Uri.file(
          join(__filename, 'resources', 'plots', 'circle.svg')
        ),
        label: 'Y',
        path: 'Y'
      }
    ])
  })
})
