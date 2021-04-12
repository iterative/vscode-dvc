import { join, resolve } from 'path'
import { Config } from './Config'
import { mocked } from 'ts-jest/utils'
import { DecorationProvider } from './DecorationProvider'
import { findDvcTrackedPaths, Repository } from './Repository'
import { window } from 'vscode'
import { listDvcOnlyRecursive } from './cli/reader'

jest.mock('./Config')
jest.mock('./cli/reader')

const mockedWindow = mocked(window)
mockedWindow.registerFileDecorationProvider = jest.fn()

const mockListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)

const dvcRoot = resolve(__dirname, '..', '..', 'demo')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('Repository', () => {
  it('should be able to be instantiated', async () => {
    const config = new Config()
    const decorationProvider = new DecorationProvider()
    const repository = new Repository(dvcRoot, config, decorationProvider)
    expect(repository.ready).toBeDefined()
  })
})

describe('findDvcTrackedPaths', () => {
  it('should return a Set of tracked paths, their folders (if files) and any paths corresponding .dvc files', async () => {
    const logFolder = 'logs'
    const logAcc = join(logFolder, 'acc.tsv')
    const logLoss = join(logFolder, 'loss.tsv')
    const model = 'model.pt'
    mockListDvcOnlyRecursive.mockResolvedValueOnce([logAcc, logLoss, model])
    const tracked = await findDvcTrackedPaths(dvcRoot, 'dvc')

    expect(tracked).toEqual(
      new Set([
        resolve(dvcRoot, logAcc),
        resolve(dvcRoot, logLoss),
        resolve(dvcRoot, logFolder),
        resolve(dvcRoot, model)
      ])
    )
  })
})
