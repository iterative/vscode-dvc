import { join } from 'path'
import { EventEmitter, Uri } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { DecorationProvider, ScmDecorationState } from './decorationProvider'
import { standardizePath } from '../../fileSystem/path'

jest.mock('vscode')
jest.mock('@hediet/std/disposable')

const mockedDisposable = jest.mocked(Disposable)

const mockedDecorationsChanged = jest.mocked(new EventEmitter<Uri[]>())
const mockedDecorationsChangedFire = jest.fn()
mockedDecorationsChanged.fire = mockedDecorationsChangedFire

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce({
    track: function <T>(disposable: T): T {
      return disposable
    }
  } as unknown as (() => void) & Disposer)
})

describe('DecorationProvider', () => {
  const dvcRoot = __dirname
  const model = standardizePath(join(dvcRoot, 'model.pt'))
  const dataDir = standardizePath(join(dvcRoot, 'data'))
  const features = standardizePath(join(dataDir, 'features'))
  const logDir = standardizePath(join(dvcRoot, 'logs'))
  const logAcc = standardizePath(join(logDir, 'acc.tsv'))
  const logLoss = standardizePath(join(logDir, 'loss.tsv'))
  const dataXml = standardizePath(join(dataDir, 'data.xml'))
  const dataCsv = standardizePath(join(dataDir, 'data.csv'))
  const prepared = standardizePath(join(dataDir, 'prepared'))

  const emptySet = new Set<string>()

  it('should be able to setState with no existing state', () => {
    const scmDecorationProvider = new DecorationProvider(
      mockedDecorationsChanged
    )

    const addedPaths = [
      join('some', 'path', 'to', 'decorate'),
      join('some', 'other', 'path', 'to', 'decorate')
    ]

    scmDecorationProvider.setState({
      committedAdded: new Set(addedPaths),
      tracked: new Set(addedPaths)
    } as ScmDecorationState)
    expect(mockedDecorationsChangedFire).toHaveBeenCalledWith(
      addedPaths.map(path => Uri.file(path))
    )
  })

  it('should update the decorations for paths that no longer have a decoration', () => {
    const scmDecorationProvider = new DecorationProvider(
      mockedDecorationsChanged
    )

    const addedPaths = [
      join('some', 'path', 'to', 'decorate'),
      join('some', 'other', 'path', 'to', 'decorate')
    ]

    const subsetOfAddedPaths = [join('some', 'path', 'to', 'decorate')]

    scmDecorationProvider.setState({
      committedAdded: new Set(addedPaths),
      tracked: new Set(addedPaths)
    } as ScmDecorationState)

    mockedDecorationsChangedFire.mockClear()

    scmDecorationProvider.setState({
      committedAdded: new Set(subsetOfAddedPaths),
      tracked: new Set(subsetOfAddedPaths)
    } as ScmDecorationState)

    expect(mockedDecorationsChangedFire).toHaveBeenCalledWith(
      addedPaths.map(path => Uri.file(path))
    )
  })

  it('should combine the existing state with the new state before providing new decorations', () => {
    const committedAdded = new Set([dataCsv])
    const committedDeleted = new Set([model])
    const uncommittedModified = new Set([features])
    const notInCache = new Set([dataXml, prepared])
    const tracked = new Set([
      dataDir,
      dataXml,
      dataCsv,
      features,
      logAcc,
      logDir,
      logLoss,
      model,
      prepared
    ])

    const initialState = {
      committedAdded,
      committedDeleted,
      committedModified: emptySet,
      committedRenamed: emptySet,
      committedUnknown: emptySet,
      notInCache: emptySet,
      tracked: emptySet,
      uncommittedAdded: emptySet,
      uncommittedDeleted: emptySet,
      uncommittedModified,
      uncommittedRenamed: emptySet,
      uncommittedUnknown: emptySet
    }

    const updatedState = {
      committedAdded,
      committedDeleted,
      committedModified: emptySet,
      committedRenamed: emptySet,
      committedUnknown: emptySet,
      notInCache,
      tracked,
      uncommittedAdded: emptySet,
      uncommittedDeleted: emptySet,
      uncommittedModified: emptySet,
      uncommittedRenamed: emptySet,
      uncommittedUnknown: emptySet
    }

    expect(initialState.committedAdded).toStrictEqual(
      updatedState.committedAdded
    )
    expect(initialState.committedDeleted).toStrictEqual(
      updatedState.committedDeleted
    )
    expect(initialState.committedRenamed).toStrictEqual(
      updatedState.committedRenamed
    )
    expect(initialState.committedModified).toStrictEqual(
      updatedState.committedModified
    )

    expect(initialState.uncommittedModified).not.toStrictEqual(
      updatedState.uncommittedModified
    )
    expect(initialState.notInCache).not.toStrictEqual(updatedState.notInCache)
    expect(initialState.tracked).not.toStrictEqual(updatedState.tracked)

    const scmDecorationProvider = new DecorationProvider(
      mockedDecorationsChanged
    )
    scmDecorationProvider.setState(initialState)
    mockedDecorationsChangedFire.mockClear()

    scmDecorationProvider.setState(updatedState)

    expect(mockedDecorationsChangedFire).toHaveBeenCalledWith(
      [
        ...committedAdded,
        ...committedDeleted,
        ...uncommittedModified,
        ...notInCache,
        dataDir,
        logAcc,
        logDir,
        logLoss
      ].map(path => Uri.file(path))
    )
  })

  it('should provide a single decoration which is based on a set priority', () => {
    const logs = new Set([logDir, logAcc, logLoss])

    const initialState = {
      committedAdded: new Set([dataXml]),
      committedDeleted: emptySet,
      committedModified: new Set([dataDir]),
      committedRenamed: emptySet,
      committedUnknown: emptySet,
      notInCache: logs,
      tracked: new Set([
        model,
        logDir,
        logAcc,
        logLoss,
        dataDir,
        dataXml,
        dataCsv,
        prepared
      ]),
      uncommittedAdded: new Set([dataCsv]),
      uncommittedDeleted: logs,
      uncommittedModified: new Set([dataDir]),
      uncommittedRenamed: emptySet,
      uncommittedUnknown: emptySet
    }

    const scmDecorationProvider = new DecorationProvider(
      mockedDecorationsChanged
    )
    scmDecorationProvider.setState(initialState)

    const expectDecoration = (
      path: string,
      privateStaticDecoration: string
    ) => {
      const prioritizedDecoration = scmDecorationProvider.provideFileDecoration(
        Uri.file(path)
      )

      expect(prioritizedDecoration).toStrictEqual(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (DecorationProvider as any)[privateStaticDecoration]
      )
    }

    expectDecoration(logDir, 'DecorationNotInCache')
    expectDecoration(dataDir, 'DecorationUncommittedModified')
    expectDecoration(dataCsv, 'DecorationUncommittedAdded')
    expectDecoration(dataXml, 'DecorationCommittedAdded')
    expectDecoration(prepared, 'DecorationTracked')
  })
})
