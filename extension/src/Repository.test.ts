import { join, resolve } from 'path'
import { Config } from './Config'
import { SourceControlManagement } from './views/SourceControlManagement'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { Repository } from './Repository'
import { listDvcOnlyRecursive, status } from './cli/reader'
import { getAllUntracked } from './git'

jest.mock('./Config')
jest.mock('@hediet/std/disposable')
jest.mock('./views/SourceControlManagement')
jest.mock('./DecorationProvider')
jest.mock('./cli/reader')
jest.mock('./git')

const mockedListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)
const mockedStatus = mocked(status)
const mockedGetAllUntracked = mocked(getAllUntracked)
const mockedDecorationProvider = mocked(DecorationProvider)
const mockedConfig = mocked(Config)
const mockedSourceControlManagement = mocked(SourceControlManagement)

const dvcRoot = resolve(__dirname, '..', '..', 'demo')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Repository', () => {
  describe('updateState', () => {
    it('should update the repository state', async () => {
      mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
      mockedStatus.mockResolvedValue({})
      mockedGetAllUntracked.mockResolvedValueOnce(new Set())
      mockedDecorationProvider.mockImplementation(function() {
        return ({ setState: jest.fn() } as unknown) as DecorationProvider
      })
      mockedSourceControlManagement.mockImplementation(function() {
        return ({
          setResourceStates: jest.fn()
        } as unknown) as SourceControlManagement
      })
      mockedConfig.mockImplementation(function() {
        return ({
          dvcPath: undefined
        } as unknown) as Config
      })

      const config = new Config()
      const decorationProvider = new DecorationProvider()
      const repository = new Repository(dvcRoot, config, decorationProvider)

      const logDir = 'logs'
      const logAcc = join(logDir, 'acc.tsv')
      const logLoss = join(logDir, 'loss.tsv')
      const MNISTDataDir = join('data', 'MNIST')
      const rawDataDir = join(MNISTDataDir, 'raw')
      const model = 'model.pt'

      mockedListDvcOnlyRecursive.mockResolvedValueOnce([
        logAcc,
        logLoss,
        model,
        rawDataDir
      ])

      const statusOutput = {
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
          'always changed'
        ],
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      } as Record<string, (Record<string, Record<string, string>> | string)[]>
      mockedStatus.mockResolvedValueOnce(statusOutput)

      const untracked = new Set([
        resolve(dvcRoot, 'some', 'untracked', 'python.py')
      ])
      mockedGetAllUntracked.mockResolvedValueOnce(untracked)

      await repository.updateState()

      const modified = new Set([resolve(dvcRoot, rawDataDir)])
      const tracked = new Set([
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, model),
        resolve(dvcRoot, rawDataDir),
        resolve(dvcRoot, logDir),
        resolve(dvcRoot, MNISTDataDir)
      ])
      const emptySet = new Set()

      expect(mockedStatus).toBeCalledWith({ cwd: dvcRoot, cliPath: undefined })
      expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
      expect(mockedListDvcOnlyRecursive).toBeCalledWith({
        cwd: dvcRoot,
        cliPath: undefined
      })

      expect(repository.getState()).toEqual({
        deleted: emptySet,
        notInCache: emptySet,
        new: emptySet,
        modified,
        tracked,
        untracked
      })
    })
  })

  it('should return an object with an entry for each path', async () => {
    mockedListDvcOnlyRecursive.mockResolvedValueOnce([])
    mockedStatus.mockResolvedValue({})
    mockedGetAllUntracked.mockResolvedValueOnce(new Set())
    mockedDecorationProvider.mockImplementation(function() {
      return ({ setState: jest.fn() } as unknown) as DecorationProvider
    })
    mockedSourceControlManagement.mockImplementation(function() {
      return ({
        setResourceStates: jest.fn()
      } as unknown) as SourceControlManagement
    })
    mockedConfig.mockImplementation(function() {
      return ({
        dvcPath: undefined
      } as unknown) as Config
    })

    const config = new Config()
    const decorationProvider = new DecorationProvider()
    const repository = new Repository(dvcRoot, config, decorationProvider)

    const logDir = 'logs'
    const logAcc = join(logDir, 'acc.tsv')
    const logLoss = join(logDir, 'loss.tsv')
    const dataDir = 'data'
    const model = 'model.pt'

    mockedListDvcOnlyRecursive.mockResolvedValueOnce([
      logAcc,
      logLoss,
      model,
      dataDir
    ])

    const tracked = new Set([
      resolve(dvcRoot, logAcc),
      resolve(dvcRoot, logLoss),
      resolve(dvcRoot, model),
      resolve(dvcRoot, dataDir),
      resolve(dvcRoot, logDir)
    ])

    const statusOutput = {
      prepare: [
        { 'changed deps': { 'data/data.xml': 'not in cache' } },
        { 'changed outs': { 'data/prepared': 'not in cache' } }
      ],
      featurize: [
        { 'changed deps': { 'data/prepared': 'not in cache' } },
        { 'changed outs': { 'data/features': 'modified' } }
      ],
      train: [
        { 'changed deps': { 'data/features': 'modified' } },
        { 'changed outs': { 'model.pkl': 'deleted' } }
      ],
      evaluate: [
        {
          'changed deps': {
            'data/features': 'modified',
            'model.pkl': 'deleted'
          }
        }
      ],
      'data/data.xml.dvc': [
        { 'changed outs': { 'data/data.xml': 'not in cache' } }
      ]
    } as Record<string, (Record<string, Record<string, string>> | string)[]>
    mockedStatus.mockResolvedValueOnce(statusOutput)
    const deleted = new Set([join(dvcRoot, 'model.pkl')])
    const modified = new Set([join(dvcRoot, 'data/features')])
    const notInCache = new Set([
      join(dvcRoot, 'data/data.xml'),
      join(dvcRoot, 'data/prepared')
    ])

    const untracked = new Set([
      resolve(dvcRoot, 'some', 'untracked', 'python.py'),
      resolve(dvcRoot, 'some', 'untracked', 'go.go'),
      resolve(dvcRoot, 'some', 'untracked', 'perl.pl')
    ])
    mockedGetAllUntracked.mockResolvedValueOnce(untracked)

    await repository.updateState()

    expect(mockedStatus).toBeCalledWith({ cwd: dvcRoot, cliPath: undefined })
    expect(mockedGetAllUntracked).toBeCalledWith(dvcRoot)
    expect(mockedListDvcOnlyRecursive).toBeCalledWith({
      cwd: dvcRoot,
      cliPath: undefined
    })

    expect(repository.getState()).toEqual({
      new: new Set(),
      modified,
      notInCache,
      deleted,
      tracked,
      untracked
    })

    expect(mockedStatus).toBeCalledWith({
      cwd: dvcRoot,
      cliPath: undefined
    })
  })
})
