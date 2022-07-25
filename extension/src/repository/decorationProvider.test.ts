import { join } from 'path'
import { EventEmitter, Uri } from 'vscode'
import { Disposable, Disposer } from '@hediet/std/disposable'
import { DecorationProvider, DecorationState } from './decorationProvider'

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
  it('should be able to setState with no existing state', () => {
    const decorationProvider = new DecorationProvider(mockedDecorationsChanged)

    const addedPaths = [
      join('some', 'path', 'to', 'decorate'),
      join('some', 'other', 'path', 'to', 'decorate')
    ]

    decorationProvider.setState({
      committedAdded: new Set(addedPaths),
      tracked: new Set(addedPaths)
    } as DecorationState)
    expect(mockedDecorationsChangedFire).toBeCalledWith(
      addedPaths.map(path => Uri.file(path))
    )
  })

  it('should update the decorations for paths that no longer have a decoration', () => {
    const decorationProvider = new DecorationProvider(mockedDecorationsChanged)

    const addedPaths = [
      join('some', 'path', 'to', 'decorate'),
      join('some', 'other', 'path', 'to', 'decorate')
    ]

    const subsetOfAddedPaths = [join('some', 'path', 'to', 'decorate')]

    decorationProvider.setState({
      committedAdded: new Set(addedPaths),
      tracked: new Set(addedPaths)
    } as DecorationState)

    mockedDecorationsChangedFire.mockClear()

    decorationProvider.setState({
      committedAdded: new Set(subsetOfAddedPaths),
      tracked: new Set(subsetOfAddedPaths)
    } as DecorationState)

    expect(mockedDecorationsChangedFire).toBeCalledWith(
      addedPaths.map(path => Uri.file(path))
    )
  })

  it('should combine the existing state with the new state before providing new decorations', () => {
    const dvcRoot = __dirname
    const model = join(dvcRoot, 'model.pt')
    const dataDir = join(dvcRoot, 'data')
    const features = join(dataDir, 'features')
    const logDir = join(dvcRoot, 'logs')
    const logAcc = join(logDir, 'acc.tsv')
    const logLoss = join(logDir, 'loss.tsv')
    const dataXml = join(dataDir, 'data.xml')
    const dataCsv = join(dataDir, 'data.csv')
    const prepared = join(dataDir, 'prepared')

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
    const emptySet = new Set<string>()

    const initialState = {
      committedAdded,
      committedDeleted,
      committedModified: emptySet,
      committedRenamed: emptySet,
      notInCache: emptySet,
      tracked: emptySet,
      uncommittedAdded: emptySet,
      uncommittedDeleted: emptySet,
      uncommittedModified,
      uncommittedRenamed: emptySet
    }

    const updatedState = {
      committedAdded,
      committedDeleted,
      committedModified: emptySet,
      committedRenamed: emptySet,
      notInCache,
      tracked,
      uncommittedAdded: emptySet,
      uncommittedDeleted: emptySet,
      uncommittedModified: emptySet,
      uncommittedRenamed: emptySet
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

    const decorationProvider = new DecorationProvider(mockedDecorationsChanged)
    decorationProvider.setState(initialState)
    mockedDecorationsChangedFire.mockClear()

    decorationProvider.setState(updatedState)

    expect(mockedDecorationsChangedFire).toBeCalledWith(
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
})
