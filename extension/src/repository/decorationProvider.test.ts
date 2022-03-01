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
      added: new Set(addedPaths),
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
      added: new Set(addedPaths),
      tracked: new Set(addedPaths)
    } as DecorationState)

    mockedDecorationsChangedFire.mockClear()

    decorationProvider.setState({
      added: new Set(subsetOfAddedPaths),
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

    const added = new Set([dataCsv])
    const deleted = new Set([model])
    const modified = new Set([features])
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
      added,
      deleted,
      gitModified: emptySet,
      modified,
      notInCache: emptySet,
      renamed: emptySet,
      tracked: emptySet
    }

    const updatedState = {
      added,
      deleted,
      gitModified: emptySet,
      modified: emptySet,
      notInCache,
      renamed: emptySet,
      tracked
    }

    expect(initialState.added).toStrictEqual(updatedState.added)
    expect(initialState.deleted).toStrictEqual(updatedState.deleted)
    expect(initialState.renamed).toStrictEqual(updatedState.renamed)
    expect(initialState.gitModified).toStrictEqual(updatedState.gitModified)

    expect(initialState.modified).not.toStrictEqual(updatedState.modified)
    expect(initialState.notInCache).not.toStrictEqual(updatedState.notInCache)
    expect(initialState.tracked).not.toStrictEqual(updatedState.tracked)

    const decorationProvider = new DecorationProvider(mockedDecorationsChanged)
    decorationProvider.setState(initialState)
    mockedDecorationsChangedFire.mockClear()

    decorationProvider.setState(updatedState)

    expect(mockedDecorationsChangedFire).toBeCalledWith(
      [
        ...added,
        ...deleted,
        ...modified,
        ...notInCache,
        dataDir,
        logAcc,
        logDir,
        logLoss
      ].map(path => Uri.file(path))
    )
  })
})
